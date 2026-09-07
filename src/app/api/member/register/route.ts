import { NextResponse } from "next/server";
import { cookies, headers } from "next/headers";
import { hashPassword } from "@/lib/password";
import {
  MEMBER_AUTH_COOKIE,
  memberCookieOptions,
  memberSessionExpires,
} from "@/lib/member-auth";
import { resolveTenantSlugForRequest } from "@/lib/tenant";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(request: Request) {
  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false, error: "Solicitud inválida." }, { status: 400 });
  }

  const fullName = String(body.full_name ?? "").trim();
  const email = String(body.email ?? "").trim().toLowerCase();
  const clave = String(body.clave ?? "");

  if (fullName.length < 2) {
    return NextResponse.json({ ok: false, error: "Escribe tu nombre completo." }, { status: 400 });
  }
  if (!EMAIL_RE.test(email)) {
    return NextResponse.json({ ok: false, error: "Correo electrónico no válido." }, { status: 400 });
  }
  if (clave.length < 6) {
    return NextResponse.json({ ok: false, error: "La clave debe tener al menos 6 caracteres." }, { status: 400 });
  }

  const { isDemoMode } = await import("@/lib/data");
  if (isDemoMode()) {
    return NextResponse.json(
      { ok: false, error: "El registro de miembros requiere base de datos conectada." },
      { status: 503 },
    );
  }

  const tenantId = await resolveTenantSlugForRequest(
    await headers(),
    new URL(request.url).searchParams.get("iglesia"),
  );

  try {
    const db = await import("@/lib/db");
    const { tenantExists } = db;
    if (!(await tenantExists(tenantId))) {
      return NextResponse.json({ ok: false, error: "Iglesia no encontrada." }, { status: 404 });
    }

    const existing = await db.findMemberByEmail(tenantId, email);
    if (existing) {
      return NextResponse.json(
        { ok: false, error: "Ya existe un miembro con ese correo en esta iglesia." },
        { status: 409 },
      );
    }

    const password_hash = await hashPassword(clave);
    const member = await db.createMember({
      tenant_id: tenantId,
      email,
      password_hash,
      full_name: fullName,
      role: "miembro",
      status: "active",
      level: 1,
    });

    const expiresAt = memberSessionExpires();
    const token = await db.createMemberSession(member.id, expiresAt);
    const store = await cookies();
    store.set(MEMBER_AUTH_COOKIE, token, memberCookieOptions());

    // Aviso de bienvenida por correo (no bloquea el registro)
    const mail = await import("@/lib/mail");
    if (mail.hasSmtp()) {
      const tenant = await db.getTenantRow(tenantId);
      const tenantName = tenant?.name ?? "tu iglesia";
      void mail.sendMail({ to: member.email, ...mail.mailWelcomeMember(tenantName) });
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[member/register]", err);
    return NextResponse.json(
      { ok: false, error: "No se pudo completar el registro." },
      { status: 503 },
    );
  }
}