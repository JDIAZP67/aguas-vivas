import Link from "next/link";
import { notFound } from "next/navigation";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import { getCourse, getLessonsForCourse, isDemoMode } from "@/lib/data";
import type { Lesson } from "@/lib/lesson";

export default async function CursoPage({
  params,
}: {
  params: Promise<{ curso: string }>;
}) {
  const { curso } = await params;

  let user = null;
  let doneIds = new Set<string>();

  if (!isDemoMode()) {
    try {
      const { createClient } = await import("@/lib/supabase/server");
      const supabase = await createClient();
      const {
        data: { user: u },
      } = await supabase.auth.getUser();
      user = u ?? null;
    } catch {}
  }

  const course = await getCourse(curso);
  if (!course) notFound();

  const lessons: Lesson[] = await getLessonsForCourse(course.slug);

  if (user && lessons.length && !isDemoMode()) {
    try {
      const { createClient } = await import("@/lib/supabase/server");
      const supabase = await createClient();
      const { data: p } = await supabase
        .from("lesson_progress")
        .select("lesson_id")
        .eq("user_id", user.id)
        .in(
          "lesson_id",
          lessons.map((x) => x.id),
        );
      doneIds = new Set((p ?? []).map((r) => r.lesson_id as string));
    } catch {}
  }

  const total = lessons.length;
  const done = lessons.filter((l) => doneIds.has(l.id)).length;
  const pct = total ? Math.round((done / total) * 100) : 0;

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

          {user && total > 0 && (
            <div className="progress-row" style={{ marginBottom: 30 }}>
              <div className="progress-track">
                <div className="progress-fill" style={{ width: `${pct}%` }} />
              </div>
              <span className="progress-pct">
                {done}/{total} · {pct}%
              </span>
            </div>
          )}

          {!total && (
            <div className="perm-note">
              <span>⏳</span>
              <div>
                <b>Sin lecciones aún</b>
                El contenido de este nivel se está preparando.
              </div>
            </div>
          )}

          {!user && total > 0 && (
            <div className="perm-note" style={{ marginBottom: 20 }}>
              <span>👀</span>
              <div>
                <b>Modo lectura libre</b>
                Puedes estudiar todas las lecciones. Para guardar tu progreso,{" "}
                <Link href="/acceso" style={{ fontWeight: 700 }}>
                  crea tu cuenta o inicia sesión
                </Link>
                .
              </div>
            </div>
          )}

          <div className="lesson-list">
            {lessons.map((l) => {
              counter += 1;
              const isDone = doneIds.has(l.id);
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
                    className={`lesson-item ${isDone ? "done" : ""}`}
                  >
                    <span className="num">{isDone ? "✓" : counter}</span>
                    <span className="info">
                      <b>{l.title}</b>
                      <span>
                        {l.duration_min} min de lectura
                        {l.verse_ref ? ` · ${l.verse_ref}` : ""}
                      </span>
                    </span>
                    <span className="state">
                      {isDone ? (
                        <span className="badge badge-discipulado">Completada</span>
                      ) : (
                        <span className="badge badge-nuevo">Estudiar →</span>
                      )}
                    </span>
                  </Link>
                </div>
              );
            })}
          </div>

          {user && total > 0 && done === total && (
            <div className="form-status ok" style={{ marginTop: 26 }}>
              🎉 ¡Nivel completado! Habla con tu pastor o maestro para tu
              preparación final y el siguiente paso.
            </div>
          )}
        </div>
      </main>

      <SiteFooter />
    </>
  );
}
