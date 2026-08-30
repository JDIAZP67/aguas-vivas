import Link from "next/link";
import { notFound } from "next/navigation";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import { getCourse, getLessonsForCourse } from "@/lib/data";
import type { Lesson } from "@/lib/lesson";

export default async function CursoPage({
  params,
}: {
  params: Promise<{ curso: string }>;
}) {
  const { curso } = await params;

  const course = await getCourse(curso);
  if (!course) notFound();

  const lessons: Lesson[] = await getLessonsForCourse(course.slug);
  const total = lessons.length;

  let lastModule = "";
  let counter = 0;

  return (
    <>
      <SiteHeader />

      <main className="block">
        <div className="section-inner" style={{ maxWidth: 760 }}>
          <Link href="/estudios" className="back-link">
            ← Volver a mis estudios
          </Link>

          <div className="section-head" style={{ marginBottom: 28 }}>
            <div className="section-eyebrow">Nivel {course.level}</div>
            <h2 style={{ fontSize: "clamp(1.6rem,3vw,2.1rem)" }}>
              {course.title}
            </h2>
            <p>{course.description}</p>
          </div>

          {!total && (
            <div className="perm-note">
              <span>⏳</span>
              <div>
                <b>Sin lecciones aún</b>
                El contenido de este nivel se está preparando.
              </div>
            </div>
          )}

          <div className="lesson-list">
            {lessons.map((l) => {
              counter += 1;
              const showModule = l.module_label && l.module_label !== lastModule;
              lastModule = l.module_label ?? "";

              return (
                <div key={l.id}>
                  {showModule && (
                    <h4
                      className="module-divider"
                      style={{
                        fontFamily: "var(--font-mono)",
                        fontSize: "0.72rem",
                        letterSpacing: "1.5px",
                        textTransform: "uppercase",
                        color: "var(--sky-mid)",
                      }}
                    >
                      {l.module_label}
                    </h4>
                  )}
                  <Link
                    href={`/estudios/${course.slug}/${l.slug}`}
                    className="lesson-item"
                  >
                    <span className="num">{counter}</span>
                    <span className="info">
                      <b>{l.title}</b>
                      <span>
                        {l.duration_min} min de lectura
                        {l.verse_ref ? ` · ${l.verse_ref}` : ""}
                      </span>
                    </span>
                    <span className="state">
                      <span className="badge badge-nuevo">Estudiar →</span>
                    </span>
                  </Link>
                </div>
              );
            })}
          </div>
        </div>
      </main>

      <SiteFooter />
    </>
  );
}
