import { NextResponse } from "next/server";
import { hasDatabase, listCourses, createLesson, updateLesson, deleteLesson } from "@/lib/db";
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

async function courseBelongsToTenant(courseId: string, tenantId: string): Promise<boolean> {
  try {
    const courses = await listCourses(tenantId);
    return courses.some((c) => c.id === courseId);
  } catch {
    return false;
  }
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

  const courseId = String(body.course_id ?? "");
  if (!courseId) {
    return NextResponse.json({ ok: false, error: "Falta el curso al que pertenece la lección." }, { status: 400 });
  }

  const title = String(body.title ?? "").trim();
  if (!title) {
    return NextResponse.json({ ok: false, error: "El título es obligatorio." }, { status: 400 });
  }

  const bodyText = String(body.body ?? "").trim();
  if (!bodyText) {
    return NextResponse.json({ ok: false, error: "El contenido (body) es obligatorio." }, { status: 400 });
  }

  const slug = toSlug(String(body.slug ?? title));
  if (!slug) {
    return NextResponse.json({ ok: false, error: "El slug no puede estar vacío." }, { status: 400 });
  }

  const sortOrder = Number(body.sort_order) > 0 ? Number(body.sort_order) : 1;
  const tenantId = await getAdminTenantSlug();
  if (!(await courseBelongsToTenant(courseId, tenantId))) {
    return NextResponse.json(
      { ok: false, error: "El curso no pertenece a esta iglesia." },
      { status: 403 },
    );
  }

  try {
    const lesson = await createLesson({
      course_id: courseId,
      slug,
      title: title.slice(0, 200),
      module_label: String(body.module_label ?? "").trim().slice(0, 100) || null,
      verse_ref: String(body.verse_ref ?? "").trim().slice(0, 100) || null,
      body: bodyText,
      duration_min: Number(body.duration_min) > 0 ? Number(body.duration_min) : 15,
      sort_order: sortOrder,
    });
    return NextResponse.json({ ok: true, lesson });
  } catch (err) {
    console.error("[lessons] create:", err);
    return NextResponse.json({ ok: false, error: "No se pudo crear la lección." }, { status: 503 });
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
  if (typeof body.module_label === "string") updates.module_label = body.module_label.trim().slice(0, 100) || null;
  if (typeof body.verse_ref === "string") updates.verse_ref = body.verse_ref.trim().slice(0, 100) || null;
  if (typeof body.body === "string") updates.body = body.body;
  if (body.duration_min !== undefined && Number(body.duration_min) > 0) updates.duration_min = Number(body.duration_min);
  if (body.sort_order !== undefined && Number(body.sort_order) > 0) updates.sort_order = Number(body.sort_order);

  if (!Object.keys(updates).length) {
    return NextResponse.json({ ok: false, error: "Nada que actualizar." }, { status: 400 });
  }

  try {
    const tenantId = await getAdminTenantSlug();
    const lesson = await updateLesson(id, tenantId, updates);
    if (!lesson) {
      return NextResponse.json({ ok: false, error: "Lección no encontrada." }, { status: 404 });
    }
    return NextResponse.json({ ok: true, lesson });
  } catch (err) {
    console.error("[lessons] update:", err);
    return NextResponse.json({ ok: false, error: "No se pudo actualizar la lección." }, { status: 503 });
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
    const ok = await deleteLesson(id, tenantId);
    if (!ok) {
      return NextResponse.json({ ok: false, error: "Lección no encontrada." }, { status: 404 });
    }
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[lessons] delete:", err);
    return NextResponse.json({ ok: false, error: "No se pudo eliminar la lección." }, { status: 503 });
  }
}