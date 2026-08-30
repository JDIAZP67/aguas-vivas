import Link from "next/link";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import { getCourses, getLessonsForCourse } from "@/lib/data";
import type { Course, Lesson } from "@/lib/lesson";

export const metadata = {
  title: "Estudios bíblicos",
};

export default async function EstudiosPage() {
  const courses: Course[] = await getCourses();

  const lessonsByCourse: Record<string, Lesson[]> = {};
  for (const c of courses) {
    lessonsByCourse[c.id] = await getLessonsForCourse(c.slug);
  }

  return (
    <>
      <SiteHeader />

      <main className="block">
        <div className="section-inner">
          <div className="section-head" style={{ marginBottom: 40 }}>
            <div className="section-eyebrow">Formación bíblica</div>
            <h2>Tu camino de crecimiento</h2>
            <p>
              Avanza paso a paso por los niveles de estudio. Cada lección
              te edifica y te prepara para el siguiente nivel.
            </p>
          </div>

          <div className="levels-grid" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))" }}>
            {courses.map((c) => {
              const total = lessonsByCourse[c.id]?.length ?? 0;

              return (
                <article key={c.id} className="level-card">
                  <span className="level-num">
                    {String(c.level).padStart(2, "0")}
                  </span>
                  <div className="level-tag">
                    {c.title.split("—")[1]?.trim() || `Nivel ${c.level}`}
                  </div>
                  <h3>{c.tagline}</h3>
                  <p>{c.description}</p>

                  {total > 0 ? (
                    <Link
                      href={`/estudios/${c.slug}`}
                      className="pbtn pbtn-solid"
                      style={{ marginTop: 14 }}
                    >
                      Ver lecciones
                    </Link>
                  ) : (
                    <>
                      <div className="level-foot">Contenido en preparación</div>
                      <button
                        className="btn"
                        disabled
                        style={{ marginTop: 18, opacity: 0.5 }}
                      >
                        Próximamente
                      </button>
                    </>
                  )}
                </article>
              );
            })}
          </div>

          <div className="card" style={{ marginTop: 34 }}>
            <h3>¿Cómo funciona el avance?</h3>
            <p style={{ color: "var(--ink-soft)", lineHeight: 1.7 }}>
              Estudia cada lección con calma y responde las preguntas de
              reflexión. Todo el contenido es de acceso libre: puedes leerlo
              cuando quieras, a tu propio ritmo.
            </p>
          </div>
        </div>
      </main>

      <SiteFooter />
    </>
  );
}
