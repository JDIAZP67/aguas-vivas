import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { ADMIN_AUTH_COOKIE, ADMIN_KEY } from "@/lib/auth";
import { DEMO_AUTH_COOKIE } from "@/lib/demo-auth";

export async function POST(request: Request) {
  let clave = "";
  const contentType = request.headers.get("content-type") ?? "";

  if (contentType.includes("application/json")) {
    try {
      const body = await request.json();
      clave = String(body?.clave ?? "").trim();
    } catch {
      clave = "";
    }
  } else {
    const fd = await request.formData();
    clave = String(fd.get("clave") ?? "").trim();
  }

  const store = await cookies();

  if (!process.env.DATABASE_URL) {
    if (!clave) {
      return NextResponse.json({ ok: false, error: "Ingresa una clave para continuar." }, { status: 400 });
    }
    store.set(DEMO_AUTH_COOKIE, "1", {
      path: "/",
      maxAge: 60 * 60 * 24 * 30,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
    });
    return NextResponse.redirect(new URL("/admin", request.url), 307);
  }

  if (!ADMIN_KEY || clave !== ADMIN_KEY) {
    return NextResponse.json({ ok: false, error: "Clave de acceso incorrecta." }, { status: 401 });
  }

  store.set(ADMIN_AUTH_COOKIE, "1", {
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
  });
  store.delete(DEMO_AUTH_COOKIE);

  return NextResponse.redirect(new URL("/admin", request.url), 307);
}
