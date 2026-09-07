import { NextResponse } from "next/server";
import { getAdminProfile } from "@/lib/auth";
import { getAdminTenantSlug } from "@/lib/tenant";

export async function PATCH(request: Request) {
  const profile = await getAdminProfile();
  if (!profile || (profile.role !== "super_admin" && profile.role !== "pastor")) {
    return NextResponse.json({ ok: false, error: "Sin permisos." }, { status: 403 });
  }

  let body: { id?: string; status?: string; tenant_id?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false, error: "Solicitud inválida." }, { status: 400 });
  }

  const decisionId = String(body.id ?? "");
  const status = String(body.status ?? "");
  const valid = ["nuevo", "contactado", "discipulado", "integrado"];
  if (!decisionId || !valid.includes(status)) {
    return NextResponse.json({ ok: false, error: "Estado no válido." }, { status: 400 });
  }

  const tenantId: string =
    profile.role === "super_admin"
      ? (body.tenant_id ? String(body.tenant_id) : await getAdminTenantSlug())
      : profile.tenant_id ?? "";

  if (!tenantId) {
    return NextResponse.json({ ok: false, error: "Sin iglesia activa." }, { status: 400 });
  }

  try {
    const db = await import("@/lib/db");
    const ok = await db.setDecisionStatus(decisionId, status as never, tenantId);
    if (!ok) {
      return NextResponse.json({ ok: false, error: "Decisión no encontrada." }, { status: 404 });
    }
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[admin/decisions]", err);
    return NextResponse.json({ ok: false, error: "No se pudo actualizar." }, { status: 503 });
  }
}