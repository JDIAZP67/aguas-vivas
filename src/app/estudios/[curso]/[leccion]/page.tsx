import Link from "next/link";
import { notFound } from "next/navigation";
import { headers } from "next/headers";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import LessonBody from "@/components/LessonBody";
import LessonCompleteButton from "@/components/LessonCompleteButton";
import { getLessonPage } from "@/lib/data";
import { getMemberSession } from "@/lib/member-auth";
import { resolveTenantSlugForRequest, searchParamSlug } from "@/lib/tenant";

export default async function LeccionPage({
  params,
  searchParams,
}: {
  params: Promise<{ curso: string; leccion: string }>;
  searchParams: Promise<{ iglesia?: string | string[] }>;
}) {
  const { curso, leccion } = await params;
  const slug = await resolveTenantSlugForRequest(
    await headers(),
    searchParamSlug((await searchParams)?.iglesia),
  );

  const member = await getMemberSession();

  const page = await getLessonPage(
    slug,
    curso,
    leccion,
    member && member.tenant_id === slug ? member.id : undefined,
  );
  if (!page) notFound();

  const { course, lesson, prev, next, done } = page;
  const memberActive = member && member.tenant_id === slug;

  // Acceso: Nivel 1 público; superiores requieren sesión con el nivel desbloqueado
  const levelUnlocked =
    course.level === 1 || (memberActive && member.level >= course.level);

  const prevHref = prev ? `/estudios/${curso}/${prev.slug}` : null;

  return (
    <>
      <SiteHeader slug={slug} />

      <main className="block">
        <div style={{ maxWidth: 760, margin: "0 auto" }}>
          <Link href={`/estudios/${course.slug}`} className="back-link">
            ← {course.title}
          </Link>

          {!levelUnlocked ? (
            <div className="lesson-shell lesson-locked" style={{ textAlign: "center" }}>
              <div className="locked-icon">🔒</div>
              <h1 className="lesson-title">{lesson.title}</h1>
              {memberActive ? (
                <>
                  <p style={{ color: "var(--ink-soft)", lineHeight: 1.7 }}>
                    Esta lección pertenece al <b>Nivel {course.level}</b>. Completa el{" "}
                    <b>100% del Nivel {course.level - 1}</b> para desbloquearla
                    automáticamente.
                  </p>
                  <Link href={`/estudios/${curso}`} className="pbtn pbtn-solid" style={{ marginTop: 16 }}>
                    Ir al Nivel {course.level - 1}
                  </Link>
                </>
              ) : (
                <>
                  <p style={{ color: "var(--ink-soft)", lineHeight: 1.7 }}>
                    Esta lección pertenece al <b>Nivel {course.level}</b>.{" "}
                    <b>Ingresa o regístrate</b> para marcar tu progreso y
                    desbloquear este nivel.
                  </p>
                  <Link href={`/acceso?iglesia=${encodeURIComponent(slug)}`} className="pbtn pbtn-solid" style={{ marginTop: 16 }}>
                    Ingresar / Registrarme
                  </Link>
                </>
              )}
            </div>
          ) : (
            <article className="lesson-shell">
              <div className="lesson-meta">
                <span className="tag">Nivel {course.level}</span>
                <span className="tag">⏱ {lesson.duration_min} min</span>
              </div>

              <h1 className="lesson-title">{lesson.title}</h1>

              <LessonBody body={lesson.body} />

              {memberActive ? (
                <div style={{ marginTop: 22 }}>
                  <LessonCompleteButton lessonId={lesson.id} initialDone={done} />
                </div>
              ) : (
                <div className="perm-note" style={{ marginTop: 26 }}>
                  <span>💡</span>
                  <div>
                    <b>Para llevar tu progreso</b>{" "}
                    <Link href={`/acceso?iglesia=${encodeURIComponent(slug)}`} className="under">
                      inicia sesión
                    </Link>{" "}
                    o <Link href={`/acceso?iglesia=${encodeURIComponent(slug)}`} className="under">regístrate</Link>.
                  </div>
                </div>
              )}

              <nav className="lesson-nav">
                {prev && levelUnlocked ? (
                  <Link href={prevHref!}>← Anterior</Link>
                ) : (
                  <span />
                )}
                {next &&
                (course.level === 1 ||
                  (memberActive && member.level >= course.level)) ? (
                  <Link href={`/estudios/${curso}/${next.slug}`}>
                    Siguiente lección →
                  </Link>
                ) : (
                  <Link href={`/estudios/${course.slug}`} style={{ color: "var(--ok)" }}>
                    Terminar nivel ✓
                  </Link>
                )}
              </nav>
            </article>
          )}
        </div>
      </main>

      <SiteFooter slug={slug} />
    </>
  );
}