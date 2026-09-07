import Link from "next/link";
import { redirect } from "next/navigation";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import LogoutButton from "@/components/LogoutButton";
import ChangePassword from "@/components/ChangePassword";
import { getMemberLevelsProgress, getNextLessonHref } from "@/lib/data";
import { getMemberSession } from "@/lib/member-auth";
import { getTenantNameBySlug } from "@/lib/tenant";
import { ROLE_LABELS, type MemberRole } from "@/lib/types";

export const metadata = {
  title: "Mi perfil",
};

export default async function MiPerfilPage() {
  const member = await getMemberSession();
  if (!member) redirect("/acceso");

  const slug = member.tenant_id;
  const progress = await getMemberLevelsProgress(slug, member.id, member.level);
  const next = await getNextLessonHref(slug, member.id, member.level);
  const tenantName = (await getTenantNameBySlug(slug)) || slug;
  const doneTotal = progress.reduce((a, p) => a + p.done, 0);
  const totalTotal = progress.reduce((a, p) => a + p.total, 0);
  const completedLevels = progress.filter((p) => !p.locked && p.total > 0 && p.done === p.total);

  return (
    <>
      <SiteHeader slug={slug} />
      <main className="block">
        <div className="section-inner" style={{ maxWidth: 820 }}>
          <div className="section-head" style={{ marginBottom: 28 }}>
            <div className="section-eyebrow">Mi cuenta</div>
            <h2>Mi perfil</h2>
          </div>

          <div style={{ display: "grid", gap: 22, gridTemplateColumns: "repeat(auto-fit, minmax(320px,1fr))" }}>
            <div className="card" style={{ padding: 22 }}>
              <div className="row" style={{ gap: 14, marginBottom: 14 }}>
                <div
                  style={{
                    width: 58,
                    height: 58,
                    borderRadius: "50%",
                    background: "var(--sky-deep)",
                    color: "#fff",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "1.4rem",
                    fontWeight: 800,
                  }}
                >
                  {member.full_name
                    .split(" ")
                    .map((x) => x[0])
                    .slice(0, 2)
                    .join("")
                    .toUpperCase()}
                </div>
                <div>
                  <b style={{ fontSize: "1.15rem" }}>{member.full_name}</b>
                  <div style={{ color: "var(--ink-soft)", fontSize: "0.86rem" }}>{member.email}</div>
                </div>
              </div>

              <dl style={{ display: "grid", gridTemplateColumns: "130px 1fr", gap: "8px 14px", margin: "0 0 4px", fontSize: "0.86rem" }}>
                <dt style={{ color: "var(--ink-soft)" }}>Iglesia</dt>
                <dd style={{ margin: 0 }}>{tenantName}</dd>
                <dt style={{ color: "var(--ink-soft)" }}>Rol</dt>
                <dd style={{ margin: 0 }}>
                  {ROLE_LABELS[member.role as MemberRole] ?? "Miembro"}
                  {member.role !== "miembro" && (
                    <Link href="/admin" style={{ marginLeft: 8, fontSize: "0.78rem", color: "var(--sky-mid)" }}>
                      Ir al panel →
                    </Link>
                  )}
                </dd>
                <dt style={{ color: "var(--ink-soft)" }}>Nivel</dt>
                <dd style={{ margin: 0 }}>
                  Nivel {member.level} · {doneTotal}/{totalTotal} lecciones
                </dd>
                <dt style={{ color: "var(--ink-soft)" }}>Miembro desde</dt>
                <dd style={{ margin: 0 }}>
                  {new Date(member.created_at).toLocaleDateString("es-PE", {
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                  })}
                </dd>
              </dl>

              {next ? (
                <Link href={next.href} className="pbtn pbtn-solid" style={{ marginTop: 18 }}>
                  ▶ Continuar donde quedaste · {next.levelTitle}
                </Link>
              ) : (
                <div className="perm-note" style={{ marginTop: 18 }}>
                  <span>🎉</span>
                  <div>
                    <b>¡Completaste todos tus niveles!</b> Habla con el pastor para continuar con el siguiente nivel.
                  </div>
                </div>
              )}
            </div>

            <ChangePassword iglesia={slug} />
          </div>

          <div className="card" style={{ padding: 22, marginTop: 22 }}>
            <b style={{ display: "block", marginBottom: 6 }}>Mis certificados</b>
            <p className="hint" style={{ margin: "0 0 14px", color: "var(--ink-soft)", fontSize: "0.84rem" }}>
              Se generan al completar el 100% de las lecciones de un nivel.
            </p>
            {completedLevels.length ? (
              <div style={{ display: "grid", gap: 12, gridTemplateColumns: "repeat(auto-fill,minmax(240px,1fr))" }}>
                {completedLevels.map((p) => (
                  <Link
                    key={p.level}
                    href={`/certificado?nivel=${p.level}&iglesia=${encodeURIComponent(slug)}`}
                    className="pbtn pbtn-ghost"
                    style={{ display: "flex", justifyContent: "space-between", padding: "12px 16px", textAlign: "left" }}
                  >
                    <span>
                      <b>Nivel {p.level}</b>
                      <div style={{ fontSize: "0.8rem", color: "var(--ink-soft)" }}>{p.title}</div>
                    </span>
                    <span style={{ alignSelf: "center" }}>🖨</span>
                  </Link>
                ))}
              </div>
            ) : (
              <p style={{ margin: 0, fontSize: "0.86rem", color: "var(--ink-soft)" }}>
                Aún no has completado ningún nivel.
              </p>
            )}
          </div>

          <div style={{ marginTop: 24, display: "flex", gap: 12 }}>
            <Link href="/mi-progreso" className="btn">Ver mi progreso</Link>
            <LogoutButton />
          </div>
        </div>
      </main>
      <SiteFooter slug={slug} />
    </>
  );
}