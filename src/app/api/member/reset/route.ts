import { NextResponse } from "next/server";
import { hashPassword } from "@/lib/password";
import { memberSessionExpires } from "@/lib/member-auth";

export async function POST(request: Request) {
  let body: { token?: string; clave?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false, error: "Solicitud inválida." }, { status: 400 });
  }

  const token = String(body.token ?? "").trim();
  const clave = String(body.clave ?? "");
  if (!token || clave.length < 6) {
    return NextResponse.json(
      { ok: false, error: "Token inválido o clave muy corta (mín. 6)." },
      { status: 400 },
    );
  }

  const { isDemoMode } = await import("@/lib/data");
  if (isDemoMode()) {
    return NextResponse.json({ ok: false, error: "Requiere base de datos conectada." }, { status: 503 });
  }

  try {
    const db = await import("@/lib/db");
    const memberId = await db.getPasswordReset(token);
    if (!memberId) {
      return NextResponse.json(
        { ok: false, error: "El enlace es inválido o caducó (30 min). Solicítalo de nuevo." },
        { status: 410 },
      );
    }

    const password_hash = await hashPassword(clave);
    await db.updateMember(memberId, { password_hash });
    await db.revokeMemberSessions(memberId);
    await db.consumePasswordReset(token);

    // Renovar la sesión para que el miembro entre ya restablecido
    const member = await db.getMember(memberId);
    if (member) {
      const sessionToken = await db.createMemberSession(member.id, memberSessionExpires());
      const { cookies } = await import("next/headers");
      const { MEMBER_AUTH_COOKIE, memberCookieOptions } = await import("@/lib/member-auth");
      const store = await cookies();
      store.set(MEMBER_AUTH_COOKIE, sessionToken, memberCookieOptions());
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[member/reset]", err);
    return NextResponse.json({ ok: false, error: "No se pudo restablecer la clave." }, { status: 503 });
  }
}