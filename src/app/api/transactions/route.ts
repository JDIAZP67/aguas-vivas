import { NextResponse } from "next/server";
import { hasDatabase, getTenantRow, createTransaction, getTransaction, updateTransaction, deleteTransaction } from "@/lib/db";
import { ADMIN_AUTH_COOKIE } from "@/lib/auth";
import { cookies, headers } from "next/headers";
import { getAdminTenantSlug, resolveTenantSlugForRequest } from "@/lib/tenant";

const INCOME_CATS = ["diezmo", "ofrenda", "donacion", "otros_ingreso"];
const EXPENSE_CATS = [
  "pago_pastor",
  "pago_copastores",
  "servicios",
  "mantenimiento",
  "misiones",
  "otros_egreso",
];
const METHODS = ["transferencia", "yape_plin", "tarjeta", "efectivo", "otro"];

function receiptCode() {
  return `AV-${Date.now().toString(36).toUpperCase()}`;
}

async function requireFinance(): Promise<{ error: string | null; status: number }> {
  if (!hasDatabase()) {
    return { error: "La base de datos no está conectada.", status: 503 };
  }
  const store = await cookies();
  const isAdmin = store.get(ADMIN_AUTH_COOKIE)?.value === "1";
  if (isAdmin) return { error: null, status: 200 };

  const { getMemberSession } = await import("@/lib/member-auth");
  const member = await getMemberSession();
  if (!member || (member.role !== "tesoreria" && member.role !== "pastor")) {
    return { error: "Debes iniciar sesión.", status: 401 };
  }
  return { error: null, status: 200 };
}

async function canApprove(): Promise<boolean> {
  const store = await cookies();
  if (store.get(ADMIN_AUTH_COOKIE)?.value === "1") return true;
  const { getMemberSession } = await import("@/lib/member-auth");
  const member = await getMemberSession();
  return Boolean(member && member.role === "pastor");
}

export async function POST(request: Request) {
  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false, error: "Solicitud inválida." }, { status: 400 });
  }

  const amount = Number(body.amount);
  if (!amount || amount <= 0 || !isFinite(amount)) {
    return NextResponse.json(
      { ok: false, error: "Ingresa un monto válido mayor a cero." },
      { status: 400 },
    );
  }

  // ---- Donación pública (sin sesión): queda pendiente hasta que Tesorería confirme
  if (body.public === true) {
    const donorName = String(body.donor_name ?? "").trim();
    if (!donorName) {
      return NextResponse.json(
        { ok: false, error: "Escribe tu nombre para registrar tu ofrenda." },
        { status: 400 },
      );
    }

    if (!hasDatabase()) {
      return NextResponse.json({ ok: true });
    }

    const method = METHODS.includes(body.method as never) ? String(body.method) : "transferencia";

    try {
      const tenantOverride = new URL(request.url).searchParams.get("iglesia");
      const tenantId = await resolveTenantSlugForRequest(await headers(), tenantOverride);
      await createTransaction({
        tenant_id: tenantId,
        kind: "ingreso",
        category: ["diezmo", "ofrenda", "donacion"].includes(String(body.category)) ? String(body.category) : "ofrenda",
        amount: Math.round(amount * 100) / 100,
        currency: "PEN",
        description: String(body.description ?? "").trim().slice(0, 500) || null,
        donor_name: donorName.slice(0, 120),
        donor_email: String(body.donor_email ?? "").trim().slice(0, 160) || null,
        donor_phone: String(body.donor_phone ?? "").trim().slice(0, 40) || null,
        method,
        status: "pendiente",
      });
    } catch (err) {
      console.error("[tx] donación pública:", err);
      return NextResponse.json({ ok: false, error: "servicio" }, { status: 503 });
    }
    return NextResponse.json({ ok: true });
  }

  // ---- Registro manual (Tesorería / Pastor)
  const auth = await requireFinance();
  if (auth.error) {
    return NextResponse.json({ ok: false, error: auth.error }, { status: auth.status });
  }

  const kind = body.kind === "egreso" ? "egreso" : "ingreso";
  const category =
    kind === "ingreso"
      ? (INCOME_CATS.includes(String(body.category)) ? String(body.category) : "ofrenda")
      : (EXPENSE_CATS.includes(String(body.category)) ? String(body.category) : "otros_egreso");

  const insert: Record<string, unknown> = {
    tenant_id: await getAdminTenantSlug(),
    kind,
    category,
    amount: Math.round(amount * 100) / 100,
    currency: "PEN",
    description: String(body.description ?? "").trim().slice(0, 500) || null,
    occurred_at: body.occurred_at ? new Date(String(body.occurred_at)).toISOString() : new Date().toISOString(),
  };

  if (kind === "ingreso") {
    Object.assign(insert, {
      donor_name: String(body.donor_name ?? "").trim().slice(0, 120) || null,
      donor_email: null,
      donor_phone: null,
      method: METHODS.includes(body.method as never) ? String(body.method) : "efectivo",
      status: "confirmado",
      receipt_code: receiptCode(),
    });
  } else {
    Object.assign(insert, {
      requested_by_name: String(body.requested_by_name ?? "").trim().slice(0, 120) || null,
      approval_status: "pendiente_aprobacion",
      status: "pendiente_aprobacion",
    });
  }

  try {
    const transaction = await createTransaction(insert);
    return NextResponse.json({ ok: true, transaction });
  } catch (err) {
    console.error("[tx] registro manual:", err);
    return NextResponse.json({ ok: false, error: "No se pudo registrar." }, { status: 503 });
  }
}

export async function PUT(request: Request) {
  const auth = await requireFinance();
  if (auth.error) {
    return NextResponse.json({ ok: false, error: auth.error }, { status: auth.status });
  }
  const tenantId = await getAdminTenantSlug();

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false, error: "Solicitud inválida." }, { status: 400 });
  }

  const id = String(body.id ?? "");
  if (!id) {
    return NextResponse.json({ ok: false, error: "Falta el identificador." }, { status: 400 });
  }

  let tx;
  try {
    tx = await getTransaction(id, tenantId);
  } catch (err) {
    console.error("[tx] get:", err);
    return NextResponse.json({ ok: false, error: "servicio" }, { status: 503 });
  }

  if (!tx) {
    return NextResponse.json({ ok: false, error: "Transacción no encontrada." }, { status: 404 });
  }

  const action = String(body.action ?? "");

  // Confirmar donación en línea pendiente → comprobante automático
  if (action === "confirmar") {
    if (tx.kind !== "ingreso" || tx.status !== "pendiente") {
      return NextResponse.json({ ok: false, error: "Solo ingresos pendientes se confirman." }, { status: 400 });
    }
    try {
      const updated = await updateTransaction(id, tenantId, {
        status: "confirmado",
        receipt_code: receiptCode(),
        occurred_at: new Date().toISOString(),
      });
      return NextResponse.json({ ok: true, transaction: updated });
    } catch (err) {
      console.error("[tx] confirmar:", err);
      return NextResponse.json({ ok: false, error: "No se pudo confirmar." }, { status: 503 });
    }
  }

  // Aprobar o rechazar egreso — Pastor / Súper Admin (clave maestra)
  if (action === "aprobar" || action === "rechazar") {
    if (!(await canApprove())) {
      return NextResponse.json(
        { ok: false, error: "Solo el Pastor puede aprobar o rechazar egresos." },
        { status: 403 },
      );
    }
    if (tx.kind !== "egreso" || tx.approval_status !== "pendiente_aprobacion") {
      return NextResponse.json({ ok: false, error: "Solo egresos pendientes de aprobación." }, { status: 400 });
    }

    const approved = action === "aprobar";
    try {
      const updated = await updateTransaction(id, tenantId, {
        approval_status: approved ? "aprobado" : "rechazado",
        status: approved ? "aprobado" : "rechazado",
        approved_by_name: "Pastorado",
        approved_at: new Date().toISOString(),
      });
      return NextResponse.json({ ok: true, transaction: updated });
    } catch (err) {
      console.error("[tx] aprobar:", err);
      return NextResponse.json({ ok: false, error: "No se pudo procesar." }, { status: 503 });
    }
  }

  // Edición simple de campos mientras esté pendiente
  const editableStatuses = ["pendiente", "pendiente_aprobacion"];
  if (!editableStatuses.includes(tx.status)) {
    return NextResponse.json(
      { ok: false, error: "Esta transacción ya está cerrada y no se puede editar." },
      { status: 400 },
    );
  }

  const updates: Record<string, unknown> = {};
  if (body.amount !== undefined && Number(body.amount) > 0) {
    updates.amount = Math.round(Number(body.amount) * 100) / 100;
  }
  if (typeof body.description === "string") {
    updates.description = body.description.trim().slice(0, 500) || null;
  }

  if (!Object.keys(updates).length) {
    return NextResponse.json({ ok: false, error: "Nada que actualizar." }, { status: 400 });
  }

  try {
    const updated = await updateTransaction(id, tenantId, updates);
    return NextResponse.json({ ok: true, transaction: updated });
  } catch (err) {
    console.error("[tx] update:", err);
    return NextResponse.json({ ok: false, error: "No se pudo actualizar." }, { status: 503 });
  }
}

export async function DELETE(request: Request) {
  const auth = await requireFinance();
  if (auth.error) {
    return NextResponse.json({ ok: false, error: auth.error }, { status: auth.status });
  }

  let body: { id?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false, error: "Solicitud inválida." }, { status: 400 });
  }

  const id = String(body.id ?? "");
  if (!id) {
    return NextResponse.json({ ok: false, error: "Falta el identificador." }, { status: 400 });
  }

  try {
    const tenantId = await getAdminTenantSlug();
    const ok = await deleteTransaction(id, tenantId);
    if (!ok) {
      return NextResponse.json({ ok: false, error: "Transacción no encontrada." }, { status: 404 });
    }
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[tx] delete:", err);
    return NextResponse.json({ ok: false, error: "No se pudo eliminar." }, { status: 503 });
  }
}