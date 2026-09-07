import { NextResponse } from "next/server";
import { cookies, headers } from "next/headers";
import { verifyPassword } from "@/lib/password";
import {
  MEMBER_AUTH_COOKIE,
  memberCookieOptions,
  memberSessionExpires,
} from "@/lib/member-auth";
import { resolveTenantSlugForRequest } from "@/lib/tenant";

export async function POST(request: Request) {
  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false, error: "Solicitud inválida." }, { status: 400 });
  }

  const email = String(body.email ?? "").trim().toLowerCase();
  const clave = String(body.clave ?? "");

  if (!email || !clave) {
    return NextResponse.json({ ok: false, error: "Ingresa tu correo y clave." }, { status: 400 });
  }

  const { isDemoMode } = await import("@/lib/data");
  if (isDemoMode()) {
    return NextResponse.json(
      { ok: false, error: "El acceso de miembros requiere base de datos conectada." },
      { status: 503 },
    );
  }

  const tenantId = await resolveTenantSlugForRequest(
    await headers(),
    new URL(request.url).searchParams.get("iglesia"),
  );

  try {
    const db = await import("@/lib/db");
    const member = await db.findMemberByEmail(tenantId, email);
    if (!member) {
      return NextResponse.json({ ok: false, error: "Correo o clave incorrectos." }, { status: 401 });
    }

    const storedHash = await db.getMemberPasswordHash(member.id);
    if (!storedHash || !(await verifyPassword(clave, storedHash))) {
      return NextResponse.json({ ok: false, error: "Correo o clave incorrectos." }, { status: 401 });
    }

    if (member.status !== "active") {
      return NextResponse.json(
        { ok: false, error: "Tu cuenta está suspendida. Consulta al pastor." },
        { status: 403 },
      );
    }

    const expiresAt = memberSessionExpires();
    const token = await db.createMemberSession(member.id, expiresAt);
    const store = await cookies();
    store.set(MEMBER_AUTH_COOKIE, token, memberCookieOptions());

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[member/login]", err);
    return NextResponse.json(
      { ok: false, error: "No se pudo completar el acceso." },
      { status: 503 },
    );
  }
}