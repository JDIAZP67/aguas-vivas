import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { hasDatabase } from "@/lib/db";
import { getAdminProfile } from "@/lib/auth";
import { ACTIVE_TENANT_COOKIE } from "@/lib/tenant";

const SLUG_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export async function POST(request: Request) {
  if (!hasDatabase()) {
    return NextResponse.json(
      { ok: false, error: "La base de datos no está conectada." },
      { status: 503 },
    );
  }

  const profile = await getAdminProfile();
  if (!profile || profile.role !== "super_admin") {
    return NextResponse.json(
      { ok: false, error: "Solo el Súper-Admin puede cambiar de iglesia." },
      { status: 403 },
    );
  }

  const store = await cookies();

  let body: { slug?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false, error: "Solicitud inválida." }, { status: 400 });
  }

  const slug = String(body.slug ?? "").trim();
  if (!slug || !SLUG_RE.test(slug)) {
    return NextResponse.json({ ok: false, error: "Slug de iglesia inválido." }, { status: 400 });
  }

  try {
    const { tenantExists } = await import("@/lib/db");
    const exists = await tenantExists(slug);
    if (!exists) {
      return NextResponse.json({ ok: false, error: "La iglesia no existe." }, { status: 404 });
    }
  } catch {
    return NextResponse.json({ ok: false, error: "No se pudo verificar la iglesia." }, { status: 503 });
  }

  try {
    store.set(ACTIVE_TENANT_COOKIE, slug, {
      path: "/",
      httpOnly: false,
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 30,
    });
  } catch {
    return NextResponse.json({ ok: false, error: "No se pudo cambiar la iglesia activa." }, { status: 503 });
  }

  return NextResponse.json({ ok: true, slug });
}