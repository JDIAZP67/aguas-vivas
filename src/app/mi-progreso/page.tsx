import Link from "next/link";
import { redirect } from "next/navigation";
import { headers } from "next/headers";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import { getMemberLevelsProgress } from "@/lib/data";
import { getMemberSession } from "@/lib/member-auth";
import { resolveTenantSlugForRequest } from "@/lib/tenant";
import LogoutButton from "@/components/LogoutButton";

export const metadata = {
  title: "Mi progreso",
};

export default async function MiProgresoPage() {
  const member = await getMemberSession();
  if (!member) redirect("/acceso");

  const slug = member.tenant_id;
  const progress = await getMemberLevelsProgress(slug, member.id, member.level);
  const doneTotal = progress.reduce((a, p) => a + p.done, 0);
  const totalTotal = progress.reduce((a, p) => a + p.total, 0);

  return (
    <>
      <SiteHeader slug={slug} />
      <main className="block">
        <div className="section-inner" style={{ maxWidth: 760 }}>
          <div className="section-head" style={{ marginBottom: 28 }}>
            <div className="section-eyebrow">Mi progreso</div>
            <h2>Hola, {member.full_name.split(" ")[0]}</h2>
            <p style={{ color: "var(--ink-soft)" }}>
              Nivel alcanzado: <b>Nivel {member.level}</b> ·{" "}
              {doneTotal}/{totalTotal} lecciones completadas
            </p>
          </div>

          <div className="lesson-list" style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {progress.map((p) => {
              const pct = p.total > 0 ? Math.round((p.done / p.total) * 100) : 0;
              return (
                <div key={p.level} className="card">
                  <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 10 }}>
                    <span className="level-num" style={{ position: "static", fontSize: "1.4rem" }}>
                      {String(p.level).padStart(2, "0")}
                    </span>
                    <div style={{ flex: 1 }}>
                      <b>{p.title}</b>
                      <div style={{ fontSize: "0.82rem", color: "var(--ink-soft)" }}>
                        {p.done}/{p.total} lecciones
                        {p.locked ? " · 🔒 bloqueado" : pct === 100 ? " · ✓ completado" : ""}
                      </div>
                    </div>
                    {p.locked ? (
                      <span style={{ fontSize: "0.85rem", color: "var(--ink-soft)" }}>
                        Completa el Nivel {p.level - 1}
                      </span>
                    ) : pct === 100 ? (
                      <span style={{ color: "var(--ok)", fontFamily: "var(--font-mono)", fontSize: "0.8rem" }}>
                        {totalTotal ? "100%" : ""}
                      </span>
                    ) : (
                      <Link href={`/estudios/${p.courseSlug}`} className="pbtn pbtn-ghost" style={{ padding: "8px 14px", fontSize: "0.8rem" }}>
                        Continuar
                      </Link>
                    )}
                  </div>
                  <div className="level-progress-track">
                    <div className="level-progress-fill" style={{ width: `${pct}%` }} />
                  </div>
                </div>
              );
            })}
          </div>

          <div style={{ marginTop: 26, display: "flex", gap: 12 }}>
            <Link href="/estudios" className="btn">Volver a estudios</Link>
            <LogoutButton />
          </div>
        </div>
      </main>
      <SiteFooter slug={slug} />
    </>
  );
}