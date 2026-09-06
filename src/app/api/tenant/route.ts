import { NextResponse } from "next/server";
import { hasDatabase, updateTenant, getTenantRow } from "@/lib/db";
import { ADMIN_AUTH_COOKIE } from "@/lib/auth";
import { DEFAULT_TENANT_SLUG } from "@/lib/constants";
import { cookies } from "next/headers";

const ALLOWED_FIELDS = [
  "name",
  "country",
  "city",
  "address",
  "description",
  "brand_color",
  "contact_email",
  "contact_phone",
  "whatsapp",
  "facebook",
  "instagram",
  "youtube",
  "service_schedule",
  "donation_info",
] as const;

export async function PUT(request: Request) {
  if (!hasDatabase()) {
    return NextResponse.json(
      { ok: false, error: "La base de datos no está conectada." },
      { status: 503 },
    );
  }

  const store = await cookies();
  if (store.get(ADMIN_AUTH_COOKIE)?.value !== "1") {
    return NextResponse.json(
      { ok: false, error: "Debes iniciar sesión." },
      { status: 401 },
    );
  }

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { ok: false, error: "Solicitud inválida." },
      { status: 400 },
    );
  }

  const name = String(body.name ?? "").trim();
  if (!name) {
    return NextResponse.json(
      { ok: false, error: "El nombre de la iglesia es obligatorio." },
      { status: 400 },
    );
  }

  const updates: Record<string, string> = { name: name.slice(0, 160) };
  for (const field of ALLOWED_FIELDS) {
    if (field === "name") continue;
    if (typeof body[field] === "string") {
      updates[field] = String(body[field]).trim().slice(0, 2000);
    }
  }
  if (!/^#[0-9a-fA-F]{6}$/.test(updates.brand_color ?? "")) {
    updates.brand_color = "#0a3b5c";
  }

  try {
    const tenant = await getTenantRow(DEFAULT_TENANT_SLUG);
    if (!tenant) {
      return NextResponse.json(
        { ok: false, error: "La iglesia no existe. Ejecuta neon/schema.sql." },
        { status: 404 },
      );
    }

    const ok = await updateTenant(DEFAULT_TENANT_SLUG, updates);
    if (!ok) {
      return NextResponse.json(
        { ok: false, error: "No se pudieron guardar los cambios." },
        { status: 503 },
      );
    }
  } catch (err) {
    console.error("[tenant] error al actualizar:", err);
    return NextResponse.json(
      { ok: false, error: "No se pudieron guardar los cambios." },
      { status: 503 },
    );
  }

  return NextResponse.json({ ok: true });
}
