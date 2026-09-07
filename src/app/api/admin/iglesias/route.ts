import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import {
  hasDatabase,
  createTenant,
  updateTenant,
  tenantExists,
  copyCoursesToTenant,
} from "@/lib/db";
import { ADMIN_AUTH_COOKIE } from "@/lib/auth";
import { DEFAULT_TENANT_SLUG } from "@/lib/constants";
import { toSlug } from "@/lib/slug";

const SLUG_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const DATA_URI_RE = /^data:image\/(png|jpeg|webp);base64,[a-zA-Z0-9+/=]+$/;
const MAX_LOGO_CHARS = 700_000;

const BRAND_FIELDS = [
  "country",
  "city",
  "address",
  "description",
  "logo_url",
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

async function requireAdmin() {
  if (!hasDatabase()) {
    return { error: "La base de datos no está conectada.", status: 503 as const };
  }
  const store = await cookies();
  if (store.get(ADMIN_AUTH_COOKIE)?.value !== "1") {
    return { error: "Debes iniciar sesión.", status: 401 as const };
  }
  return { error: null, status: 200 as const };
}

function cleanLogo(value: string): string | null {
  const logo = value.trim();
  if (!logo) return null;
  if (!DATA_URI_RE.test(logo)) return "";
  if (logo.length > MAX_LOGO_CHARS) return "";
  return logo;
}

function collectBrandFields(body: Record<string, unknown>): Record<string, unknown> {
  const updates: Record<string, unknown> = {};
  for (const field of BRAND_FIELDS) {
    if (typeof body[field] !== "string") continue;
    const value = String(body[field]).trim().slice(0, 2000);
    if (field === "brand_color") {
      updates.brand_color = /^#[0-9a-fA-F]{6}$/.test(value) ? value : "#0a3b5c";
      continue;
    }
    if (field === "logo_url") continue;
    updates[field] = value || null;
  }
  if (typeof body.logo_url === "string") {
    updates.logo_url = cleanLogo(String(body.logo_url));
  }
  return updates;
}

export async function POST(request: Request) {
  const ctx = await requireAdmin();
  if (ctx.error) {
    return NextResponse.json({ ok: false, error: ctx.error }, { status: ctx.status });
  }

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false, error: "Solicitud inválida." }, { status: 400 });
  }

  const name = String(body.name ?? "").trim();
  if (!name) {
    return NextResponse.json({ ok: false, error: "El nombre de la iglesia es obligatorio." }, { status: 400 });
  }

  const slug = toSlug(String(body.slug ?? name));
  if (!SLUG_RE.test(slug)) {
    return NextResponse.json({ ok: false, error: "El slug no es válido." }, { status: 400 });
  }

  if (await tenantExists(slug)) {
    return NextResponse.json({ ok: false, error: "Ese slug ya existe." }, { status: 409 });
  }

  const updates = collectBrandFields(body);
  const plan = body.plan === "premium" ? "premium" : "free";
  const status = ["pending", "active", "suspended"].includes(String(body.status))
    ? String(body.status)
    : "pending";
  if (updates.logo_url === "") {
    return NextResponse.json({ ok: false, error: "El enlace del logo no es válido." }, { status: 400 });
  }

  try {
    const tenant = await createTenant({
      slug,
      name: name.slice(0, 160),
      primary_domain: String(body.primary_domain ?? "").trim().toLowerCase() || null,
      ...updates,
      plan,
      status,
    });

    let cloned = 0;
    if (body.clone_nivel1 === true && slug !== DEFAULT_TENANT_SLUG) {
      cloned = await copyCoursesToTenant(DEFAULT_TENANT_SLUG, slug);
    }

    return NextResponse.json({ ok: true, tenant, cloned });
  } catch (err) {
    console.error("[iglesias] create:", err);
    return NextResponse.json({ ok: false, error: "No se pudo crear la iglesia." }, { status: 503 });
  }
}

export async function PUT(request: Request) {
  const ctx = await requireAdmin();
  if (ctx.error) {
    return NextResponse.json({ ok: false, error: ctx.error }, { status: ctx.status });
  }

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false, error: "Solicitud inválida." }, { status: 400 });
  }

  const slug = String(body.slug ?? "").trim();
  if (!slug || !await tenantExists(slug)) {
    return NextResponse.json({ ok: false, error: "La iglesia no existe." }, { status: 404 });
  }

  const updates = collectBrandFields(body);

  if (body.plan === "premium" || body.plan === "free") updates.plan = body.plan;
  if (["pending", "active", "suspended"].includes(String(body.status))) {
    updates.status = String(body.status);
  }
  if (typeof body.primary_domain === "string") {
    updates.primary_domain = body.primary_domain.trim().toLowerCase() || null;
  }
  if (typeof body.name === "string" && body.name.trim()) {
    updates.name = body.name.trim().slice(0, 160);
  }
  if (updates.logo_url === "") {
    return NextResponse.json({ ok: false, error: "El enlace del logo no es válido." }, { status: 400 });
  }

  try {
    const ok = await updateTenant(slug, updates);
    if (!ok) {
      return NextResponse.json({ ok: false, error: "No se pudo actualizar la iglesia." }, { status: 503 });
    }
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[iglesias] update:", err);
    return NextResponse.json({ ok: false, error: "No se pudo actualizar la iglesia." }, { status: 503 });
  }
}