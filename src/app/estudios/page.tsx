import Link from "next/link";
import { headers } from "next/headers";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import {
  getCourses,
  getLessonsForCourse,
  getMemberLevelsProgress,
  type LevelProgress,
} from "@/lib/data";
import { getMemberSession } from "@/lib/member-auth";
import { resolveTenantSlugForRequest, searchParamSlug } from "@/lib/tenant";
import type { Course, Lesson } from "@/lib/lesson";

export const metadata = {
  title: "Estudios bíblicos",
};

export default async function EstudiosPage({
  searchParams,
}: {
  searchParams: Promise<{ iglesia?: string | string[] }>;
}) {
  const slug = await resolveTenantSlugForRequest(
    await headers(),
    searchParamSlug((await searchParams)?.iglesia),
  );
  const courses: Course[] = await getCourses(slug);

  const lessonsByCourse: Record<string, Lesson[]> = {};
  for (const c of courses) {
    lessonsByCourse[c.id] = await getLessonsForCourse(slug, c.slug);
  }

  const member = await getMemberSession();
  const memberActive = member && member.tenant_id === slug;

  let progress: LevelProgress[] = [];
  if (memberActive) {
    try {
      progress = await getMemberLevelsProgress(slug, member.id, member.level);
    } catch {
      progress = [];
    }
  }

  const progressByLevel = new Map(progress.map((p) => [p.level, p]));

  return (
    <>
      <SiteHeader slug={slug} />

      <main className="block">
        <div className="section-inner">
          <div className="section-head" style={{ marginBottom: 40 }}>
            <div className="section-eyebrow">Formación bíblica</div>
            <h2>Tu camino de crecimiento</h2>
            <p>
              Nivel 1 es de acceso libre. Avanza por los niveles: cada lección
              te edifica y te prepara para el siguiente nivel, que se desbloquea
              al completarlo.
            </p>
          </div>

          <div className="levels-grid" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))" }}>
            {courses.map((c) => {
              const total = lessonsByCourse[c.id]?.length ?? 0;
              const p = progressByLevel.get(c.level);
              const done = p?.done ?? 0;
              const locked = c.level > 1 && p?.locked !== false;
              const pct = total > 0 ? Math.round((done / total) * 100) : 0;

              return (
                <article key={c.id} className={`level-card ${locked ? "locked" : ""}`}>
                  <span className="level-num">
                    {String(c.level).padStart(2, "0")}
                  </span>
                  {locked && <span className="level-badge">🔒 {pct === 0 && !memberActive ? "Requiere nivel anterior" : "Bloqueado"}</span>}
                  <div className="level-tag">
                    {c.title.split("—")[1]?.trim() || `Nivel ${c.level}`}
                  </div>
                  <h3>{c.tagline}</h3>
                  <p>{c.description}</p>

                  {memberActive && total > 0 && (
                    <div className="level-progress">
                      <div className="level-progress-track">
                        <div className="level-progress-fill" style={{ width: `${pct}%` }} />
                      </div>
                      <span>
                        {done}/{total} lecciones {pct > 0 ? `· ${pct}%` : ""}
                      </span>
                    </div>
                  )}

                  {locked ? (
                    <div className="level-foot">
                      {memberActive
                        ? `Completa el Nivel ${c.level - 1} para desbloquear.`
                        : "Completa el Nivel 1 e inicia sesión para desbloquear."}
                    </div>
                  ) : total > 0 ? (
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

          {!memberActive && (
            <div className="perm-note" style={{ marginTop: 30 }}>
              <span>💡</span>
              <div>
                <b>Regístrate gratis</b> para llevar tu progreso, desbloquear
                los niveles de estudio y recibir tu camino personalizado.
              </div>
            </div>
          )}

          <div className="card" style={{ marginTop: 34 }}>
            <h3>¿Cómo funciona el avance?</h3>
            <p style={{ color: "var(--ink-soft)", lineHeight: 1.7 }}>
              El Nivel 1 es público: puedes leerlo libremente. Para avanzar,
              regístrate e inicia sesión; al completar el 100% de las lecciones
              de un nivel, el siguiente se desbloquea automáticamente.
            </p>
          </div>
        </div>
      </main>

      <SiteFooter slug={slug} />
    </>
  );
}