import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { DEFAULT_TENANT_SLUG } from "@/lib/constants";
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
    return { error: "No tienes permisos para gestionar cursos.", status: 403 as const, supabase };
  }

  return { error: null, status: 200 as const, supabase };
}

async function getTenantId(supabase: Awaited<ReturnType<typeof createClient>>) {
  const { data } = await supabase
    .from("tenants")
    .select("id")
    .eq("slug", DEFAULT_TENANT_SLUG)
    .maybeSingle();
  return data?.id ?? null;
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

  const title = String(body.title ?? "").trim();
  if (!title) {
    return NextResponse.json({ ok: false, error: "El título es obligatorio." }, { status: 400 });
  }

  const level = Number(body.level);
  if (!level || level < 1) {
    return NextResponse.json({ ok: false, error: "El nivel debe ser un número entero positivo." }, { status: 400 });
  }

  const tenantId = await getTenantId(ctx.supabase);
  if (!tenantId) {
    return NextResponse.json({ ok: false, error: "La iglesia no existe." }, { status: 404 });
  }

  const slug = toSlug(String(body.slug ?? title)) || toSlug(title) || `nivel-${level}`;

  const { data, error } = await ctx.supabase
    .from("courses")
    .insert({
      tenant_id: tenantId,
      slug,
      level,
      title: title.slice(0, 200),
      tagline: String(body.tagline ?? "").trim().slice(0, 300) || null,
      description: String(body.description ?? "").trim().slice(0, 1000) || null,
      sort_order: Number(body.sort_order) > 0 ? Number(body.sort_order) : level,
    })
    .select()
    .single();

  if (error) {
    console.error("[courses] create:", error.message);
    return NextResponse.json({ ok: false, error: "No se pudo crear el curso." }, { status: 503 });
  }

  return NextResponse.json({ ok: true, course: data });
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
  if (typeof body.slug === "string" && body.slug.trim()) {
    updates.slug = toSlug(body.slug);
  }
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

  const { data, error } = await ctx.supabase
    .from("courses")
    .update(updates)
    .eq("id", id)
    .select()
    .single();

  if (error) {
    console.error("[courses] update:", error.message);
    return NextResponse.json({ ok: false, error: "No se pudo actualizar el curso." }, { status: 503 });
  }

  if (!data) {
    return NextResponse.json({ ok: false, error: "Sin permisos para modificar este curso." }, { status: 403 });
  }

  return NextResponse.json({ ok: true, course: data });
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

  const { data: deleted, error } = await ctx.supabase.from("courses").delete().eq("id", id).select("id");

  if (error) {
    console.error("[courses] delete:", error.message);
    return NextResponse.json({ ok: false, error: "No se pudo eliminar el curso." }, { status: 503 });
  }

  if (!deleted?.length) {
    return NextResponse.json({ ok: false, error: "Sin permisos para eliminar este curso." }, { status: 403 });
  }

  return NextResponse.json({ ok: true });
}
