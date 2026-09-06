import { NextResponse } from "next/server";
import { hasDatabase, setLessonProgress, unsetLessonProgress } from "@/lib/db";
import { ADMIN_AUTH_COOKIE } from "@/lib/auth";
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
  if (store.get(ADMIN_AUTH_COOKIE)?.value !== "1") {
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

  try {
    if (complete) {
      await setLessonProgress(lessonId);
    } else {
      await unsetLessonProgress(lessonId);
    }
  } catch (err) {
    console.error("[progress]", err);
    return NextResponse.json({ ok: false }, { status: 503 });
  }

  return NextResponse.json({ ok: true });
}