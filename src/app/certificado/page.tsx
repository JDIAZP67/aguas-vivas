import { redirect } from "next/navigation";
import { getMemberSession } from "@/lib/member-auth";
import { getMemberLevelsProgress } from "@/lib/data";
import { getTenantNameBySlug } from "@/lib/tenant";

export const metadata = {
  title: "Certificado",
};

export default async function CertificadoPage({
  searchParams,
}: {
  searchParams: Promise<{ nivel?: string | string[] }>;
}) {
  const member = await getMemberSession();
  if (!member) redirect("/acceso");

  const sp = await searchParams;
  const nivel = Number(Array.isArray(sp.nivel) ? sp.nivel[0] : sp.nivel);
  if (!Number.isFinite(nivel) || nivel < 1) redirect("/mi-perfil");

  const slug = member.tenant_id;
  const progress = await getMemberLevelsProgress(slug, member.id, member.level);
  const level = progress.find((p) => p.level === nivel);

  const done =
    !!level && !level.locked && level.total > 0 && level.done === level.total;
  if (!done) redirect("/mi-perfil");

  const tenantName = (await getTenantNameBySlug(slug)) || slug;

  return (
    <main
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 32,
        background: "linear-gradient(160deg, #f4f8fa, #dfe9ee)",
      }}
    >
      <section
        className="cert"
        style={{
          background: "#fff",
          border: "6px double var(--sky-deep)",
          borderRadius: 16,
          maxWidth: 720,
          width: "100%",
          padding: "48px 40px",
          textAlign: "center",
        }}
      >
        <div style={{ fontFamily: "var(--font-mono)", letterSpacing: "3px", fontSize: "0.8rem", color: "var(--sky-mid)" }}>
          {tenantName.toUpperCase()}
        </div>
        <h1
          style={{
            fontFamily: "Georgia, 'Times New Roman', serif",
            fontSize: "2rem",
            margin: "10px 0 4px",
            color: "var(--sky-deep)",
          }}
        >
          Certificado de formación
        </h1>

        <div style={{ margin: "26px 0" }}>
          <div style={{ fontSize: "0.82rem", color: "var(--ink-soft)" }}>Se otorga a</div>
          <div
            style={{
              fontFamily: "Georgia, serif",
              fontSize: "2rem",
              margin: "6px 0",
              color: "var(--ink)",
              borderBottom: "2px solid rgba(10,59,92,0.25)",
              display: "inline-block",
              padding: "0 18px 4px",
            }}
          >
            {member.full_name}
          </div>
        </div>

        <p style={{ fontSize: "1.02rem", color: "var(--ink)" }}>
          por haber completado con éxito el <b>Nivel {level.level}</b>
          <br />
          <em>{level.title}</em> —{" "}
          {level.done} lecciones
        </p>

        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginTop: 34,
            fontFamily: "var(--font-mono)",
            fontSize: "0.76rem",
            color: "var(--ink-soft)",
          }}
        >
          <div style={{ textAlign: "center" }}>
            <div style={{ borderTop: "1px solid rgba(10,59,92,0.4)", paddingTop: 6, minWidth: 170 }}>
              {new Date().toLocaleDateString("es-PE", { day: "numeric", month: "long", year: "numeric" })}
            </div>
            Fecha
          </div>
          <div style={{ fontSize: "0.72rem" }}>Aguas Vivas · Formación permitida por el Espíritu</div>
        </div>
      </section>

      <div
        style={{
          position: "fixed",
          bottom: 18,
          left: 0,
          right: 0,
          display: "flex",
          gap: 12,
          justifyContent: "center",
        }}
      >
        <button className="btn btn-primary" onClick={() => window.print()}>
          Imprimir / Guardar PDF
        </button>
        <a className="btn" href="/mi-perfil">← Volver a mi perfil</a>
      </div>

      <style>{`@media print {
  * { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
  body { background: #fff; }
  .app-sidebar, .app-header, .print-hide { display: none !important; }
  button, a.btn { display: none !important; }
  .cert { border-radius: 0; }
}`}</style>
    </main>
  );
}