import { NextResponse } from "next/server";
import { getAdminProfile } from "@/lib/auth";
import { getAdminTenantSlug } from "@/lib/tenant";

export async function PATCH(request: Request) {
  const profile = await getAdminProfile();
  if (!profile || (profile.role !== "super_admin" && profile.role !== "pastor")) {
    return NextResponse.json({ ok: false, error: "Sin permisos." }, { status: 403 });
  }

  let body: { id?: string; action?: string; value?: unknown; tenant_id?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false, error: "Solicitud inválida." }, { status: 400 });
  }

  const memberId = String(body.id ?? "");
  const action = String(body.action ?? "");
  if (!memberId || !["role", "status", "password"].includes(action)) {
    return NextResponse.json({ ok: false, error: "Acción no válida." }, { status: 400 });
  }

  // Ámbito: el super-admin opera sobre el tenant indicado (o el activo); pastor solo su iglesia.
  const targetTenant =
    profile.role === "super_admin"
      ? body.tenant_id
        ? String(body.tenant_id)
        : await getAdminTenantSlug()
      : profile.tenant_id;

  const db = await import("@/lib/db");
  const member = await db.getMember(memberId);
  if (!member || member.tenant_id !== targetTenant) {
    return NextResponse.json({ ok: false, error: "Miembro no encontrado." }, { status: 404 });
  }

  try {
    if (action === "role") {
      const value = String(body.value ?? "");
      if (!["miembro", "maestro", "tesoreria", "pastor"].includes(value)) {
        return NextResponse.json({ ok: false, error: "Rol no válido." }, { status: 400 });
      }
      await db.updateMember(member.id, { role: value });
    } else if (action === "status") {
      const value = String(body.value ?? "");
      if (value === "active" || value === "suspended") {
        await db.updateMember(member.id, { status: value });
        if (value === "suspended") await db.revokeMemberSessions(member.id);
      }
    } else if (action === "password") {
      const value = String(body.value ?? "");
      if (value.length < 6) {
        return NextResponse.json({ ok: false, error: "La clave debe tener al menos 6 caracteres." }, { status: 400 });
      }
      const { hashPassword } = await import("@/lib/password");
      await db.updateMember(member.id, { password_hash: await hashPassword(value) });
      await db.revokeMemberSessions(member.id);
    }
  } catch (err) {
    console.error("[admin/members]", err);
    return NextResponse.json({ ok: false, error: "No se pudo actualizar el miembro." }, { status: 503 });
  }

  return NextResponse.json({ ok: true });
}