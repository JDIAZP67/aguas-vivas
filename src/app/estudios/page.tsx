import Link from "next/link";
import { redirect } from "next/navigation";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import { createClient } from "@/lib/supabase/server";
import { DEFAULT_TENANT_SLUG } from "@/lib/constants";
import type { Course, Lesson } from "@/lib/lesson";

export const metadata = {
  title: "Estudios bíblicos",
};

export default async function EstudiosPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/acceso");

  let courses: Course[] = [];
  let doneLessonIds = new Set<string>();

  try {
    const { data: tenant } = await supabase
      .from("tenants")
      .select("id")
      .eq("slug", DEFAULT_TENANT_SLUG)
      .maybeSingle();

    if (tenant) {
      const { data } = await supabase
        .from("courses")
        .select("id, slug, level, title, tagline, description, sort_order")
        .eq("tenant_id", tenant.id)
        .order("level", { ascending: true });
      courses = (data as Course[]) ?? [];
    }

    const { data: progress } = await supabase
      .from("lesson_progress")
      .select("lesson_id")
      .eq("user_id", user.id);
    doneLessonIds = new Set((progress ?? []).map((r) => r.lesson_id as string));
  } catch {}

  const courseIds = courses.map((c) => c.id);

  const lessonsByCourse: Record<string, Lesson[]> = {};
  if (courseIds.length) {
    try {
      const { data } = await supabase
        .from("lessons")
        .select("id, course_id")
        .in("course_id", courseIds);
      for (const row of data ?? []) {
        const cid = row.course_id as string;
        (lessonsByCourse[cid] ??= []).push(row as Lesson);
      }
    } catch {}
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
              completada suma a tu progreso y te prepara para el siguiente
              nivel.
            </p>
          </div>

          {!courses.length && (
            <div className="perm-note">
              <span>📚</span>
              <div>
                <b>Aún no hay contenido de estudios</b>
                Ejecuta en Supabase el archivo{" "}
                <code>supabase/schema-fase2.sql</code> y luego{" "}
                <code>supabase/seed-nivel1.sql</code> para activar el Nivel 1.
              </div>
            </div>
          )}

          <div className="levels-grid" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))" }}>
            {courses.map((c) => {
              const p = progressOf(c.id);
              const locked =
                c.level > 1 &&
                courses.some(
                  (prev) =>
                    prev.level === c.level - 1 && progressOf(prev.id).pct < 100,
                );

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

                  {locked ? (
                    <>
                      <div className="level-locked-note">🔒 Bloqueado</div>
                      <div className="level-foot" style={{ marginTop: 8 }}>
                        Se habilita al completar el nivel anterior
                      </div>
                    </>
                  ) : p.total > 0 ? (
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
                      <Link
                        href={`/estudios/${c.slug}`}
                        className="pbtn pbtn-solid"
                        style={{ marginTop: 18 }}
                      >
                        {p.done === 0
                          ? "Comenzar nivel"
                          : p.done >= p.total
                            ? "Repasar lecciones"
                            : "Continuar"}
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
              Estudia cada lección con calma, responde las preguntas de
              reflexión y márcala como completada. Tu maestro o pastor puede ver
              tu avance para acompañarte. Al terminar un nivel, el siguiente se
              desbloquea automáticamente.
            </p>
          </div>
        </div>
      </main>

      <SiteFooter />
    </>
  );
}
