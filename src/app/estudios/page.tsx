import Link from "next/link";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import { getCourses, getLessonsForCourse, isDemoMode } from "@/lib/data";
import type { Course, Lesson } from "@/lib/lesson";

export const metadata = {
  title: "Estudios bíblicos",
};

export default async function EstudiosPage() {
  let user = null;
  let doneLessonIds = new Set<string>();

  if (!isDemoMode()) {
    try {
      const { createClient } = await import("@/lib/supabase/server");
      const supabase = await createClient();
      const {
        data: { user: u },
      } = await supabase.auth.getUser();
      user = u ?? null;

      if (user) {
        const { data: progress } = await supabase
          .from("lesson_progress")
          .select("lesson_id")
          .eq("user_id", user.id);
        doneLessonIds = new Set(
          (progress ?? []).map((r) => r.lesson_id as string),
        );
      }
    } catch {}
  }

  const courses: Course[] = await getCourses();

  const lessonsByCourse: Record<string, Lesson[]> = {};
  for (const c of courses) {
    lessonsByCourse[c.id] = await getLessonsForCourse(c.slug);
  }

  function progressOf(courseId: string): { pct: number; done: number; total: number } {
    const total = lessonsByCourse[courseId]?.length ?? 0;
    if (!total) return { pct: 0, done: 0, total: 0 };
    const done = lessonsByCourse[courseId].filter((l) => doneLessonIds.has(l.id)).length;
    return { pct: Math.round((done / total) * 100), done, total };
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

          {!user && !isDemoMode() ? null : !user ? (
            <div className="perm-note" style={{ marginBottom: 24 }}>
              <span>👀</span>
              <div>
                <b>Explorando en modo libre</b>
                Puedes leer todas las lecciones sin crear cuenta. Si inicias
                sesión, además podrás guardar tu progreso de estudio.{" "}
                <Link href="/acceso" style={{ fontWeight: 700 }}>
                  Crear cuenta o entrar →
                </Link>
              </div>
            </div>
          ) : null}

          <div className="levels-grid" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))" }}>
            {courses.map((c) => {
              const p = progressOf(c.id);

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

                  {p.total > 0 ? (
                    <>
                      {user && (
                        <>
                          <div className="progress-row">
                            <div className="progress-track">
                              <div
                                className="progress-fill"
                                style={{ width: `${p.pct}%` }}
                              />
                            </div>
                            <span className="progress-pct">{p.pct}%</span>
                          </div>
                          <div className="level-foot" style={{ marginTop: 8 }}>
                            {p.done} de {p.total} lecciones completadas
                          </div>
                        </>
                      )}
                      <Link
                        href={`/estudios/${c.slug}`}
                        className="pbtn pbtn-solid"
                        style={{ marginTop: user ? 18 : 14 }}
                      >
                        {user && p.done === 0
                          ? "Comenzar nivel"
                          : user && p.done >= p.total
                            ? "Repasar lecciones"
                            : "Ver lecciones"}
                      </Link>
                    </>
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
              reflexión. Si creas tu cuenta podrás marcar lecciones como
              completadas y tu pastor podrá acompañar tu avance. Sin cuenta,
              todo el contenido sigue siendo accesible.
            </p>
          </div>
        </div>
      </main>

      <SiteFooter />
    </>
  );
}
