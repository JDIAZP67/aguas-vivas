import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  return handle(request, true);
}

export async function DELETE(request: Request) {
  return handle(request, false);
}

async function handle(request: Request, complete: boolean) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
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

  if (complete) {
    const { error } = await supabase
      .from("lesson_progress")
      .upsert(
        { user_id: user.id, lesson_id: lessonId },
        { onConflict: "user_id,lesson_id" },
      );
    if (error) {
      console.error("[progress] upsert:", error.message);
      return NextResponse.json({ ok: false }, { status: 503 });
    }
  } else {
    const { error } = await supabase
      .from("lesson_progress")
      .delete()
      .eq("user_id", user.id)
      .eq("lesson_id", lessonId);
    if (error) {
      console.error("[progress] delete:", error.message);
      return NextResponse.json({ ok: false }, { status: 503 });
    }
  }

  return NextResponse.json({ ok: true });
}
