import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import { createClient } from "@/lib/supabase/server";
import { DEFAULT_TENANT_SLUG } from "@/lib/constants";
import type { Course, Lesson } from "@/lib/lesson";

export default async function CursoPage({
  params,
}: {
  params: Promise<{ curso: string }>;
}) {
  const { curso } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/acceso");

  let course: Course | null = null;
  let lessons: Lesson[] = [];
  let doneIds = new Set<string>();

  try {
    const { data: tenant } = await supabase
      .from("tenants")
      .select("id")
      .eq("slug", DEFAULT_TENANT_SLUG)
      .maybeSingle();

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

      if (lessons.length) {
        const { data: p } = await supabase
          .from("lesson_progress")
          .select("lesson_id")
          .eq("user_id", user.id)
          .in(
            "lesson_id",
            lessons.map((x) => x.id),
          );
        doneIds = new Set((p ?? []).map((r) => r.lesson_id as string));
      }
    }
  } catch {}

  if (!course) notFound();

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

          {total > 0 && (
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
                Ejecuta <code>supabase/seed-nivel1.sql</code> en Supabase para
                cargar el contenido.
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

          {total > 0 && done === total && (
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
