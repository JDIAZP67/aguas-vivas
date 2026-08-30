import Link from "next/link";
import { notFound } from "next/navigation";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import LessonBody from "@/components/LessonBody";
import { getLessonPage } from "@/lib/data";

export default async function LeccionPage({
  params,
}: {
  params: Promise<{ curso: string; leccion: string }>;
}) {
  const { curso, leccion } = await params;

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
