import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { randomBytes } from "node:crypto";
import { sendMail, mailResetPassword } from "@/lib/mail";
import { resolveTenantSlugForRequest } from "@/lib/tenant";

const RESET_TTL_MIN = 30;

export async function POST(request: Request) {
  let body: { email?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false, error: "Solicitud inválida." }, { status: 400 });
  }

  const email = String(body.email ?? "").trim().toLowerCase();
  if (!email) {
    return NextResponse.json({ ok: false, error: "Escribe tu correo." }, { status: 400 });
  }

  const { isDemoMode } = await import("@/lib/data");
  if (isDemoMode()) {
    return NextResponse.json(
      { ok: false, error: "La recuperación de clave requiere base de datos conectada." },
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

    // No revelar si el correo existe
    if (!member) {
      return NextResponse.json({ ok: true });
    }

    if (!(await import("@/lib/mail")).hasSmtp()) {
      return NextResponse.json(
        { ok: false, error: "El correo de recuperación no está configurado; contacta al pastor." },
        { status: 503 },
      );
    }

    const token = randomBytes(32).toString("hex");
    const expiresAt = new Date(Date.now() + RESET_TTL_MIN * 60_000).toISOString();
    await db.createPasswordReset(member.id, token, expiresAt);
    await import("@/lib/mail").then((m) =>
      m.sendMail({
        to: member.email,
        ...m.mailResetPassword({ fullName: member.full_name, token }),
      }),
    );

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[member/forgot]", err);
    return NextResponse.json({ ok: false, error: "No se pudo procesar la solicitud." }, { status: 503 });
  }
}