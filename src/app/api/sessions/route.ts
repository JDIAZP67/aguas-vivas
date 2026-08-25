import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { DEFAULT_TENANT_SLUG } from "@/lib/constants";

const TYPES = ["predicacion", "clase", "anuncio"] as const;
const STATUSES = ["programada", "en_vivo", "finalizada"] as const;

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
    return { error: "No tienes permisos para gestionar sesiones.", status: 403 as const, supabase };
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
    return NextResponse.json(
      { ok: false, error: "El título es obligatorio." },
      { status: 400 },
    );
  }

  const tenantId = await getTenantId(ctx.supabase);
  if (!tenantId) {
    return NextResponse.json(
      { ok: false, error: "La iglesia no existe. Ejecuta supabase/schema.sql." },
      { status: 404 },
    );
  }

  const type = TYPES.includes(body.type as (typeof TYPES)[number])
    ? (body.type as string)
    : "predicacion";

  const startsAtRaw = String(body.starts_at ?? "").trim();

  const { data, error } = await ctx.supabase
    .from("sessions")
    .insert({
      tenant_id: tenantId,
      title: title.slice(0, 160),
      type,
      host_name: String(body.host_name ?? "").trim().slice(0, 120) || null,
      starts_at: startsAtRaw ? new Date(startsAtRaw).toISOString() : null,
      duration_min: Number(body.duration_min) > 0 ? Number(body.duration_min) : 60,
      video_url: String(body.video_url ?? "").trim().slice(0, 500) || null,
      notes: String(body.notes ?? "").trim().slice(0, 1000) || null,
      status: "programada",
    })
    .select()
    .single();

  if (error) {
    console.error("[sessions] create:", error.message);
    return NextResponse.json({ ok: false, error: "No se pudo crear la sesión." }, { status: 503 });
  }

  return NextResponse.json({ ok: true, session: data });
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

  if (typeof body.title === "string" && body.title.trim()) updates.title = body.title.trim().slice(0, 160);
  if (typeof body.host_name === "string") updates.host_name = body.host_name.trim().slice(0, 120) || null;
  if (typeof body.video_url === "string") updates.video_url = body.video_url.trim().slice(0, 500) || null;
  if (typeof body.notes === "string") updates.notes = body.notes.trim().slice(0, 1000) || null;

  if (TYPES.includes(body.type as (typeof TYPES)[number])) updates.type = body.type;
  if (STATUSES.includes(body.status as (typeof STATUSES)[number])) updates.status = body.status;

  if (body.starts_at !== undefined) {
    const raw = String(body.starts_at ?? "").trim();
    updates.starts_at = raw ? new Date(raw).toISOString() : null;
  }
  if (body.duration_min !== undefined && Number(body.duration_min) > 0) {
    updates.duration_min = Number(body.duration_min);
  }

  const { data, error } = await ctx.supabase
    .from("sessions")
    .update(updates)
    .eq("id", id)
    .select()
    .single();

  if (error) {
    console.error("[sessions] update:", error.message);
    return NextResponse.json({ ok: false, error: "No se pudo actualizar." }, { status: 503 });
  }

  return NextResponse.json({ ok: true, session: data });
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

  const { error } = await ctx.supabase.from("sessions").delete().eq("id", id);
  if (error) {
    return NextResponse.json({ ok: false, error: "No se pudo eliminar." }, { status: 503 });
  }

  return NextResponse.json({ ok: true });
}
