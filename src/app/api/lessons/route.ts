import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { toSlug } from "@/lib/slug";

async function requireEditor() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: "Debes iniciar sesión.", status: 401 as const, supabase };

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();

  const role = profile?.role;
  if (!role || !["super_admin", "pastor", "maestro"].includes(role)) {
    return { error: "No tienes permisos para gestionar lecciones.", status: 403 as const, supabase };
  }

  return { error: null, status: 200 as const, supabase };
}

export async function POST(request: Request) {
  const ctx = await requireEditor();
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

  const sort_order = Number(body.sort_order) > 0 ? Number(body.sort_order) : 1;

  const { data, error } = await ctx.supabase
    .from("lessons")
    .insert({
      course_id: courseId,
      slug,
      title: title.slice(0, 200),
      module_label: String(body.module_label ?? "").trim().slice(0, 100) || null,
      verse_ref: String(body.verse_ref ?? "").trim().slice(0, 100) || null,
      body: bodyText,
      duration_min: Number(body.duration_min) > 0 ? Number(body.duration_min) : 15,
      sort_order,
    })
    .select()
    .single();

  if (error) {
    console.error("[lessons] create:", error.message);
    return NextResponse.json({ ok: false, error: "No se pudo crear la lección." }, { status: 503 });
  }

  return NextResponse.json({ ok: true, lesson: data });
}

export async function PUT(request: Request) {
  const ctx = await requireEditor();
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

  const { data, error } = await ctx.supabase
    .from("lessons")
    .update(updates)
    .eq("id", id)
    .select()
    .single();

  if (error) {
    console.error("[lessons] update:", error.message);
    return NextResponse.json({ ok: false, error: "No se pudo actualizar la lección." }, { status: 503 });
  }

  if (!data) {
    return NextResponse.json({ ok: false, error: "Sin permisos para modificar esta lección." }, { status: 403 });
  }

  return NextResponse.json({ ok: true, lesson: data });
}

export async function DELETE(request: Request) {
  const ctx = await requireEditor();
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

  const { data: deleted, error } = await ctx.supabase.from("lessons").delete().eq("id", id).select("id");

  if (error) {
    console.error("[lessons] delete:", error.message);
    return NextResponse.json({ ok: false, error: "No se pudo eliminar la lección." }, { status: 503 });
  }

  if (!deleted?.length) {
    return NextResponse.json({ ok: false, error: "Sin permisos para eliminar esta lección." }, { status: 403 });
  }

  return NextResponse.json({ ok: true });
}
