import Link from "next/link";
import { notFound } from "next/navigation";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import LessonBody from "@/components/LessonBody";
import LessonCompleteButton from "@/components/LessonCompleteButton";
import { createClient } from "@/lib/supabase/server";
import { DEFAULT_TENANT_SLUG } from "@/lib/constants";
import type { Course, Lesson } from "@/lib/lesson";

export default async function LeccionPage({
  params,
}: {
  params: Promise<{ curso: string; leccion: string }>;
}) {
  const { curso, leccion } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  let course: Course | null = null;
  let lessons: Lesson[] = [];
  let isDone = false;

  try {
    const { data: tenant } = await supabase
      .from("tenants")
      .select("id")
      .eq("slug", DEFAULT_TENANT_SLUG)
      .maybeSingle();

    if (tenant) {
      const { data: c } = await supabase
        .from("courses")
        .select("id, slug, level, title, tagline, description, sort_order")
        .eq("slug", curso)
        .maybeSingle();
      course = (c as Course) ?? null;

      if (course) {
        const { data: l } = await supabase
          .from("lessons")
          .select(
            "id, course_id, slug, title, module_label, verse_ref, body, duration_min, sort_order",
          )
          .eq("course_id", course.id)
          .order("sort_order", { ascending: true });
        lessons = (l as Lesson[]) ?? [];
      }
    }

    if (user && lessons.length) {
      const current = lessons.find((x) => x.slug === leccion);
      if (current) {
        const { data: p } = await supabase
          .from("lesson_progress")
          .select("lesson_id")
          .eq("user_id", user.id)
          .eq("lesson_id", current.id)
          .maybeSingle();
        isDone = Boolean(p);
      }
    }
  } catch {}

  const index = lessons.findIndex((x) => x.slug === leccion);
  if (!course || index === -1) notFound();

  const lesson = lessons[index];
  const prev = lessons[index - 1];
  const next = lessons[index + 1];

  return (
    <>
      <SiteHeader />

      <main className="block">
        <div style={{ maxWidth: 760, margin: "0 auto" }}>
          <Link href={`/estudios/${course.slug}`} className="back-link">
            ← {course.title}
          </Link>

          <article className="lesson-shell">
            <div className="lesson-meta">
              <span className="tag">{lesson.module_label}</span>
              <span className="tag">⏱ {lesson.duration_min} min</span>
            </div>

            <h1 className="lesson-title">{lesson.title}</h1>

            <LessonBody body={lesson.body} />

            <div style={{ marginTop: 36 }}>
              {user ? (
                <LessonCompleteButton lessonId={lesson.id} initialDone={isDone} />
              ) : (
                <div className="form-status ok">
                  Regístrate o inicia sesión para guardar tu progreso en esta
                  lección.{" "}
                  <Link href="/acceso" style={{ fontWeight: 700 }}>
                    Ir al acceso →
                  </Link>
                </div>
              )}
            </div>

            <nav className="lesson-nav">
              {prev ? (
                <Link href={`/estudios/${curso}/${prev.slug}`}>← Anterior</Link>
              ) : (
                <span />
              )}
              {next ? (
                <Link href={`/estudios/${curso}/${next.slug}`}>
                  Siguiente lección →
                </Link>
              ) : (
                <Link href={`/estudios/${curso}`} style={{ color: "var(--ok)" }}>
                  Terminar nivel ✓
                </Link>
              )}
            </nav>
          </article>
        </div>
      </main>

      <SiteFooter />
    </>
  );
}
