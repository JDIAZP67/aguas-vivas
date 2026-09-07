import Link from "next/link";
import { notFound } from "next/navigation";
import { headers } from "next/headers";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import { getCourse, getLessonsForCourse } from "@/lib/data";
import { getMemberSession } from "@/lib/member-auth";
import { resolveTenantSlugForRequest, searchParamSlug } from "@/lib/tenant";
import type { Lesson } from "@/lib/lesson";

export default async function CursoPage({
  params,
  searchParams,
}: {
  params: Promise<{ curso: string }>;
  searchParams: Promise<{ iglesia?: string | string[] }>;
}) {
  const { curso } = await params;
  const slug = await resolveTenantSlugForRequest(
    await headers(),
    searchParamSlug((await searchParams)?.iglesia),
  );

  const course = await getCourse(slug, curso);
  if (!course) notFound();

  const lessons: Lesson[] = await getLessonsForCourse(slug, course.slug);
  const total = lessons.length;

  const member = await getMemberSession();
  const memberActive = member && member.tenant_id === slug;
  const levelUnlocked =
    course.level === 1 || (memberActive && member.level >= course.level);

  const doneIds = new Set<string>();
  if (memberActive && levelUnlocked) {
    try {
      const db = await import("@/lib/db");
      for (const id of await db.completedLessonIds(member.id)) doneIds.add(String(id));
    } catch {
      // sin datos
    }
  }

  let lastModule = "";
  let counter = 0;

  return (
    <>
      <SiteHeader slug={slug} />

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

          {!levelUnlocked ? (
            <div className="perm-note" style={{ marginTop: 20 }}>
              <span>🔒</span>
              <div>
                <b>Nivel bloqueado</b>
                {memberActive
                  ? ` Completa el 100% del Nivel ${course.level - 1} para desbloquear este nivel automáticamente.`
                  : " Inicia sesión o regístrate para desbloquear los niveles de estudio."}
              </div>
              <Link
                href={`/acceso?iglesia=${encodeURIComponent(slug)}`}
                className="pbtn pbtn-solid"
                style={{ marginTop: 10, marginLeft: "auto" }}
              >
                {memberActive ? "Ir al Nivel anterior" : "Ingresar / Registrarme"}
              </Link>
            </div>
          ) : (
            <div className="lesson-list">
              {lessons.map((l) => {
                counter += 1;
                const showModule = l.module_label && l.module_label !== lastModule;
                lastModule = l.module_label ?? "";
                const isDone = doneIds.has(String(l.id));

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
                          <span className="badge badge-ok">Completada</span>
                        ) : (
                          <span className="badge badge-nuevo">Estudiar →</span>
                        )}
                      </span>
                    </Link>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </main>

      <SiteFooter slug={slug} />
    </>
  );
}
