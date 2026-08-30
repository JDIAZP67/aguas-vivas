import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { ADMIN_AUTH_COOKIE } from "@/lib/auth";
import { createSession, updateSession, deleteSession } from "@/lib/db";
import type { Session, SessionType, SessionStatus } from "@/lib/types";

const TYPES = ["predicacion", "clase", "anuncio"] as const;
const STATUSES = ["programada", "en_vivo", "finalizada"] as const;

async function requireEditor(): Promise<{ error: string | null; status: number }> {
  if (!process.env.DATABASE_URL) {
    return { error: "La base de datos no está conectada.", status: 503 };
  }
  const store = await cookies();
  if (store.get(ADMIN_AUTH_COOKIE)?.value !== "1") {
    return { error: "Debes iniciar sesión.", status: 401 };
  }
  return { error: null, status: 200 };
}

function sessionHelpers(body: Record<string, unknown>) {
  const type = TYPES.includes(body.type as (typeof TYPES)[number])
    ? (body.type as SessionType)
    : "predicacion";
  const status = STATUSES.includes(body.status as (typeof STATUSES)[number])
    ? (body.status as SessionStatus)
    : "programada";
  return { type, status };
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

  const { type } = sessionHelpers(body);
  const startsAtRaw = String(body.starts_at ?? "").trim();
  const session: Session = {
    id: crypto.randomUUID(),
    tenant_id: "aguas-vivas",
    title: title.slice(0, 160),
    type,
    course_id: null,
    host_name: String(body.host_name ?? "").trim().slice(0, 120) || null,
    starts_at: startsAtRaw ? new Date(startsAtRaw).toISOString() : null,
    duration_min: Number(body.duration_min) > 0 ? Number(body.duration_min) : 60,
    video_url: String(body.video_url ?? "").trim().slice(0, 500) || null,
    notes: String(body.notes ?? "").trim().slice(0, 1000) || null,
    status: "programada",
  };

  try {
    const created = await createSession(session);
    return NextResponse.json({ ok: true, session: created });
  } catch (err) {
    console.error("[sessions] create:", err);
    return NextResponse.json({ ok: false, error: "No se pudo crear la sesión." }, { status: 503 });
  }
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

  const { type, status } = sessionHelpers(body);
  if (TYPES.includes(body.type as (typeof TYPES)[number])) updates.type = type;
  if (STATUSES.includes(body.status as (typeof STATUSES)[number])) updates.status = status;

  if (body.starts_at !== undefined) {
    const raw = String(body.starts_at ?? "").trim();
    updates.starts_at = raw ? new Date(raw).toISOString() : null;
  }
  if (body.duration_min !== undefined && Number(body.duration_min) > 0) {
    updates.duration_min = Number(body.duration_min);
  }

  try {
    const updated = await updateSession(id, updates);
    if (!updated) {
      return NextResponse.json({ ok: false, error: "Sesión no encontrada." }, { status: 404 });
    }
    return NextResponse.json({ ok: true, session: updated });
  } catch (err) {
    console.error("[sessions] update:", err);
    return NextResponse.json({ ok: false, error: "No se pudo actualizar." }, { status: 503 });
  }
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

  try {
    const ok = await deleteSession(id);
    if (!ok) {
      return NextResponse.json({ ok: false, error: "Sesión no encontrada." }, { status: 404 });
    }
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[sessions] delete:", err);
    return NextResponse.json({ ok: false, error: "No se pudo eliminar." }, { status: 503 });
  }
}
