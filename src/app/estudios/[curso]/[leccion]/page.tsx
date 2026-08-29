import Link from "next/link";
import { notFound } from "next/navigation";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import LessonBody from "@/components/LessonBody";
import LessonCompleteButton from "@/components/LessonCompleteButton";
import { getLessonPage, isDemoMode } from "@/lib/data";

export default async function LeccionPage({
  params,
}: {
  params: Promise<{ curso: string; leccion: string }>;
}) {
  const { curso, leccion } = await params;

  let user = null;
  let isDone = false;

  if (!isDemoMode()) {
    try {
      const { createClient } = await import("@/lib/supabase/server");
      const supabase = await createClient();
      const {
        data: { user: u },
      } = await supabase.auth.getUser();
      user = u ?? null;

      let page = await getLessonPage(curso, leccion);
      if (user && page) {
        const current = page.lesson;
        const { data: p } = await supabase
          .from("lesson_progress")
          .select("lesson_id")
          .eq("user_id", user.id)
          .eq("lesson_id", current.id)
          .maybeSingle();
        isDone = Boolean(p);
      }
    } catch {}
  }

  const page = await getLessonPage(curso, leccion);
  if (!page) notFound();

  const { course, lesson, prev, next } = page;

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
              {user && !isDemoMode() ? (
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
