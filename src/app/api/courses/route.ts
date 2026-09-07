import { NextResponse } from "next/server";
import { hasDatabase, createCourse, updateCourse, deleteCourse } from "@/lib/db";
import { ADMIN_AUTH_COOKIE } from "@/lib/auth";
import { cookies } from "next/headers";
import { getAdminTenantSlug } from "@/lib/tenant";
import { toSlug } from "@/lib/slug";

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

  const title = String(body.title ?? "").trim();
  if (!title) {
    return NextResponse.json({ ok: false, error: "El título es obligatorio." }, { status: 400 });
  }

  const level = Number(body.level);
  if (!level || level < 1) {
    return NextResponse.json({ ok: false, error: "El nivel debe ser un número entero positivo." }, { status: 400 });
  }

  const slug = toSlug(String(body.slug ?? title)) || toSlug(title) || `nivel-${level}`;

  try {
    const tenantId = await getAdminTenantSlug();
    const course = await createCourse({
      tenant_id: tenantId,
      slug,
      level,
      title: title.slice(0, 200),
      tagline: String(body.tagline ?? "").trim().slice(0, 300) || null,
      description: String(body.description ?? "").trim().slice(0, 1000) || null,
      sort_order: Number(body.sort_order) > 0 ? Number(body.sort_order) : level,
    });
    return NextResponse.json({ ok: true, course });
  } catch (err) {
    console.error("[courses] create:", err);
    return NextResponse.json({ ok: false, error: "No se pudo crear el curso." }, { status: 503 });
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

  const id = String(body.id ?? "");
  if (!id) {
    return NextResponse.json({ ok: false, error: "Falta el identificador." }, { status: 400 });
  }

  const updates: Record<string, unknown> = {};

  if (typeof body.title === "string" && body.title.trim()) updates.title = body.title.trim().slice(0, 200);
  if (typeof body.slug === "string" && body.slug.trim()) updates.slug = toSlug(body.slug);
  if (typeof body.tagline === "string") updates.tagline = body.tagline.trim().slice(0, 300) || null;
  if (typeof body.description === "string") updates.description = body.description.trim().slice(0, 1000) || null;
  if (body.level !== undefined) {
    const level = Number(body.level);
    if (level >= 1) updates.level = level;
  }
  if (body.sort_order !== undefined) {
    const sort = Number(body.sort_order);
    if (sort >= 0) updates.sort_order = sort;
  }

  if (!Object.keys(updates).length) {
    return NextResponse.json({ ok: false, error: "Nada que actualizar." }, { status: 400 });
  }

  try {
    const tenantId = await getAdminTenantSlug();
    const course = await updateCourse(id, tenantId, updates);
    if (!course) {
      return NextResponse.json({ ok: false, error: "Curso no encontrado." }, { status: 404 });
    }
    return NextResponse.json({ ok: true, course });
  } catch (err) {
    console.error("[courses] update:", err);
    return NextResponse.json({ ok: false, error: "No se pudo actualizar el curso." }, { status: 503 });
  }
}

export async function DELETE(request: Request) {
  const ctx = await requireAdmin();
  if (ctx.error) {
    return NextResponse.json({ ok: false, error: ctx.error }, { status: ctx.status });
  }

  let body: { id?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false, error: "Solicitud inválida." }, { status: 400 });
  }

  const id = String(body.id ?? "");
  if (!id) {
    return NextResponse.json({ ok: false, error: "Falta el identificador." }, { status: 400 });
  }

  try {
    const tenantId = await getAdminTenantSlug();
    const ok = await deleteCourse(id, tenantId);
    if (!ok) {
      return NextResponse.json({ ok: false, error: "Curso no encontrado." }, { status: 404 });
    }
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[courses] delete:", err);
    return NextResponse.json({ ok: false, error: "No se pudo eliminar el curso." }, { status: 503 });
  }
}
