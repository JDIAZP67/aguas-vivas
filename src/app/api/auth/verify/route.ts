import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { ADMIN_AUTH_COOKIE, ADMIN_KEY } from "@/lib/auth";

export async function POST(request: Request) {
  let body: { clave?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false, error: "Solicitud inválida." }, { status: 400 });
  }

  const clave = String(body.clave ?? "").trim();

  if (!process.env.DATABASE_URL) {
    return NextResponse.json({ ok: false, error: "La base de datos no está conectada." }, { status: 503 });
  }

  if (!ADMIN_KEY || clave !== ADMIN_KEY) {
    return NextResponse.json({ ok: false, error: "Clave de acceso incorrecta." }, { status: 401 });
  }

  const store = await cookies();
  store.set(ADMIN_AUTH_COOKIE, "1", {
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
  });

  return NextResponse.json({ ok: true });
}
