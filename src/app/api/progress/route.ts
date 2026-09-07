import { NextResponse } from "next/server";
import { headers } from "next/headers";
import {
  hasDatabase,
  setLessonProgress,
  unsetLessonProgress,
} from "@/lib/db";
import { ADMIN_AUTH_COOKIE } from "@/lib/auth";
import { getMemberSession } from "@/lib/member-auth";
import { resolveTenantSlugForRequest } from "@/lib/tenant";
import { cookies } from "next/headers";

export async function POST(request: Request) {
  return handle(request, true);
}

export async function DELETE(request: Request) {
  return handle(request, false);
}

async function handle(request: Request, complete: boolean) {
  if (!hasDatabase()) {
    return NextResponse.json(
      { ok: false, error: "La base de datos no está conectada." },
      { status: 503 },
    );
  }

  const store = await cookies();
  const isAdmin = store.get(ADMIN_AUTH_COOKIE)?.value === "1";
  const member = isAdmin ? null : await getMemberSession();
  if (!isAdmin && !member) {
    return NextResponse.json(
      { ok: false, error: "Debes iniciar sesión." },
      { status: 401 },
    );
  }

  let body: { lessonId?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { ok: false, error: "Solicitud inválida." },
      { status: 400 },
    );
  }

  const lessonId = String(body.lessonId ?? "");
  if (!lessonId) {
    return NextResponse.json(
      { ok: false, error: "Falta la lección." },
      { status: 400 },
    );
  }

  const userRef = isAdmin ? "admin" : member!.id;
  const tenantId = isAdmin
    ? await resolveTenantSlugForRequest(await headers(), null)
    : member!.tenant_id;

  try {
    const db = await import("@/lib/db");
    if (complete) {
      await db.setLessonProgress(lessonId, userRef);
    } else {
      await db.unsetLessonProgress(lessonId, userRef);
    }
    if (member) await db.syncMemberLevel(member.id, tenantId);
  } catch (err) {
    console.error("[progress]", err);
    return NextResponse.json({ ok: false }, { status: 503 });
  }

  return NextResponse.json({ ok: true });
}