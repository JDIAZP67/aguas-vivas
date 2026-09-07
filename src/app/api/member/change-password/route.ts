import { NextResponse } from "next/server";
import { hashPassword, verifyPassword } from "@/lib/password";
import { getMemberSession, memberSessionExpires } from "@/lib/member-auth";

export async function POST(request: Request) {
  const member = await getMemberSession();
  if (!member) {
    return NextResponse.json({ ok: false, error: "Sin sesión activa." }, { status: 401 });
  }

  let body: { current?: string; nueva?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false, error: "Solicitud inválida." }, { status: 400 });
  }

  const current = String(body.current ?? "");
  const nueva = String(body.nueva ?? "");
  if (nueva.length < 6) {
    return NextResponse.json({ ok: false, error: "La clave nueva debe tener al menos 6 caracteres." }, { status: 400 });
  }

  try {
    const db = await import("@/lib/db");
    const currentHash = await db.getMemberPasswordHash(member.id);
    if (!currentHash) {
      return NextResponse.json({ ok: false, error: "Cuenta no encontrada." }, { status: 404 });
    }

    const valid = await verifyPassword(current, currentHash);
    if (!valid) {
      return NextResponse.json({ ok: false, error: "La clave actual es incorrecta." }, { status: 400 });
    }

    await db.updateMember(member.id, { password_hash: await hashPassword(nueva) });
    await db.revokeMemberSessions(member.id);

    // Nueva sesión para que siga dentro sin volver a entrar
    const token = await db.createMemberSession(member.id, memberSessionExpires());
    const { cookies } = await import("next/headers");
    const { MEMBER_AUTH_COOKIE, memberCookieOptions } = await import("@/lib/member-auth");
    const store = await cookies();
    store.set(MEMBER_AUTH_COOKIE, token, memberCookieOptions());

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[member/change-password]", err);
    return NextResponse.json({ ok: false, error: "No se pudo cambiar la clave." }, { status: 503 });
  }
}