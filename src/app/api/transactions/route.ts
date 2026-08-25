import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { DEFAULT_TENANT_SLUG } from "@/lib/constants";

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

async function ctx() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let role: string | null = null;
  if (user) {
    const { data } = await supabase
      .from("profiles")
      .select("role, full_name")
      .eq("id", user.id)
      .maybeSingle();
    role = data?.role ?? null;
  }

  return { supabase, user, role };
}

function isFinance(role: string | null) {
  return ["super_admin", "pastor", "tesoreria"].includes(role ?? "");
}
function canApprove(role: string | null) {
  return ["super_admin", "pastor"].includes(role ?? "");
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

    const supabase = await ctx().then((c) => c.supabase);
    const { data: tenant } = await supabase
      .from("tenants")
      .select("id")
      .eq("slug", DEFAULT_TENANT_SLUG)
      .maybeSingle();

    if (!tenant) {
      return NextResponse.json({ ok: false, error: "servicio" }, { status: 503 });
    }

    const method = METHODS.includes(body.method as never) ? String(body.method) : "transferencia";

    const { error } = await supabase.from("transactions").insert({
      tenant_id: tenant.id,
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

    if (error) {
      console.error("[tx] donación pública:", error.message);
      return NextResponse.json({ ok: false, error: "servicio" }, { status: 503 });
    }
    return NextResponse.json({ ok: true });
  }

  // ---- Registro manual (Tesorería / Pastor)
  const { supabase, role } = await ctx();
  if (!isFinance(role)) {
    return NextResponse.json(
      { ok: false, error: "No tienes acceso al módulo de mayordomía." },
      { status: 403 },
    );
  }

  const kind = body.kind === "egreso" ? "egreso" : "ingreso";
  const category =
    kind === "ingreso"
      ? (INCOME_CATS.includes(String(body.category)) ? String(body.category) : "ofrenda")
      : (EXPENSE_CATS.includes(String(body.category)) ? String(body.category) : "otros_egreso");

  const { data: tenant } = await supabase
    .from("tenants")
    .select("id")
    .eq("slug", DEFAULT_TENANT_SLUG)
    .maybeSingle();

  if (!tenant) {
    return NextResponse.json({ ok: false, error: "Falta configurar Supabase." }, { status: 404 });
  }

  const insert: Record<string, unknown> = {
    tenant_id: tenant.id,
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

  const { data, error } = await supabase
    .from("transactions")
    .insert(insert)
    .select()
    .single();

  if (error) {
    console.error("[tx] registro manual:", error.message);
    return NextResponse.json({ ok: false, error: "No se pudo registrar." }, { status: 503 });
  }

  return NextResponse.json({ ok: true, transaction: data });
}

export async function PUT(request: Request) {
  const { supabase, role } = await ctx();
  if (!isFinance(role)) {
    return NextResponse.json(
      { ok: false, error: "No tienes acceso al módulo de mayordomía." },
      { status: 403 },
    );
  }

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

  const { data: tx } = await supabase
    .from("transactions")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (!tx) {
    return NextResponse.json({ ok: false, error: "Transacción no encontrada." }, { status: 404 });
  }

  const action = String(body.action ?? "");

  // Confirmar donación en línea pendiente → comprobante automático
  if (action === "confirmar") {
    if (tx.kind !== "ingreso" || tx.status !== "pendiente") {
      return NextResponse.json({ ok: false, error: "Solo ingresos pendientes se confirman." }, { status: 400 });
    }
    const { data, error } = await supabase
      .from("transactions")
      .update({ status: "confirmado", receipt_code: receiptCode(), occurred_at: new Date().toISOString() })
      .eq("id", id)
      .select()
      .single();

    if (error) {
      console.error("[tx] confirmar:", error.message);
      return NextResponse.json({ ok: false, error: "No se pudo confirmar." }, { status: 503 });
    }
    return NextResponse.json({ ok: true, transaction: data });
  }

  // Aprobar o rechazar egreso — SOLO Pastor / Súper Admin (separación de roles)
  if (action === "aprobar" || action === "rechazar") {
    if (!canApprove(role)) {
      return NextResponse.json(
        { ok: false, error: "Solo el Pastor puede aprobar o rechazar egresos." },
        { status: 403 },
      );
    }
    if (tx.kind !== "egreso" || tx.approval_status !== "pendiente_aprobacion") {
      return NextResponse.json({ ok: false, error: "Solo egresos pendientes de aprobación." }, { status: 400 });
    }

    const approved = action === "aprobar";
    const { data, error } = await supabase
      .from("transactions")
      .update({
        approval_status: approved ? "aprobado" : "rechazado",
        status: approved ? "aprobado" : "rechazado",
        approved_by_name: role === "pastor" ? "Pastorado" : "Súper Admin",
        approved_at: new Date().toISOString(),
      })
      .eq("id", id)
      .select()
      .single();

    if (error) {
      console.error("[tx] aprobar:", error.message);
      return NextResponse.json({ ok: false, error: "No se pudo procesar." }, { status: 503 });
    }
    return NextResponse.json({ ok: true, transaction: data });
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

  const { data, error } = await supabase
    .from("transactions")
    .update(updates)
    .eq("id", id)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ ok: false, error: "No se pudo actualizar." }, { status: 503 });
  }
  return NextResponse.json({ ok: true, transaction: data });
}

export async function DELETE(request: Request) {
  const { supabase, role } = await ctx();
  if (!canApprove(role)) {
    return NextResponse.json(
      { ok: false, error: "Solo el Pastor puede eliminar registros." },
      { status: 403 },
    );
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

  const { error } = await supabase.from("transactions").delete().eq("id", id);
  if (error) {
    return NextResponse.json({ ok: false, error: "No se pudo eliminar." }, { status: 503 });
  }
  return NextResponse.json({ ok: true });
}
