import Link from "next/link";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import { createClient } from "@/lib/supabase/server";
import { DEFAULT_TENANT_SLUG } from "@/lib/constants";
import { toEmbedUrl } from "@/lib/youtube";
import type { Session } from "@/lib/types";

export const metadata = {
  title: "Biblioteca de grabaciones — Aguas Vivas",
};

export default async function BibliotecaPage() {
  let recordings: Session[] = [];

  try {
    const supabase = await createClient();
    const { data: tenant } = await supabase
      .from("tenants")
      .select("id")
      .eq("slug", DEFAULT_TENANT_SLUG)
      .maybeSingle();

    if (tenant) {
      const { data } = await supabase
        .from("sessions")
        .select(
          "id, tenant_id, title, type, course_id, host_name, starts_at, duration_min, video_url, notes, status",
        )
        .eq("tenant_id", tenant.id)
        .eq("status", "finalizada")
        .order("starts_at", { ascending: false })
        .limit(30);
      recordings = (data as Session[]) ?? [];
    }
  } catch {}

  return (
    <>
      <SiteHeader />

      <main className="block">
        <div className="section-inner">
          <div className="section-head" style={{ marginBottom: 44 }}>
            <div className="section-eyebrow">Biblioteca de contenido</div>
            <h2>Grabaciones disponibles</h2>
            <p>
              ¿No pudiste conectarte en el horario original? Aquí encuentras
              las predicaciones y clases anteriores para ver cuando quieras.
            </p>
          </div>

          {!recordings.length && (
            <div className="perm-note">
              <span>📼</span>
              <div>
                <b>Aún no hay grabaciones</b>
                Cuando el pastorado finalice una transmisión con video,
                aparecerá aquí automáticamente.
              </div>
            </div>
          )}

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))",
              gap: 26,
            }}
          >
            {recordings.map((s) => {
              const embed = toEmbedUrl(s.video_url);
              return (
                <article key={s.id} className="level-card" style={{ padding: 0, overflow: "hidden" }}>
                  {embed ? (
                    <iframe
                      src={embed}
                      title={s.title}
                      loading="lazy"
                      allow="accelerometer; clipboard-write; encrypted-media; picture-in-picture"
                      allowFullScreen
                      style={{
                        width: "100%",
                        aspectRatio: "16/9",
                        border: "none",
                        display: "block",
                      }}
                    />
                  ) : (
                    <div
                      style={{
                        aspectRatio: "16/9",
                        background:
                          "linear-gradient(160deg, #0a3b5c, #123a52 60%, #051824)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        color: "rgba(244,248,250,0.55)",
                        fontFamily: "var(--font-mono)",
                        fontSize: "0.75rem",
                        letterSpacing: "1px",
                      }}
                    >
                      SIN GRABACIÓN DISPONIBLE
                    </div>
                  )}
                  <div style={{ padding: "20px 22px 24px" }}>
                    <div className="level-tag">{s.type === 'clase' ? 'Clase' : s.type === 'anuncio' ? 'Anuncios' : 'Predicación'}</div>
                    <h3 style={{ fontSize: "1.1rem", marginBottom: 8 }}>{s.title}</h3>
                    <p style={{ fontSize: "0.84rem", marginBottom: 0 }}>
                      {s.host_name ? `${s.host_name} · ` : ""}
                      {s.starts_at &&
                        new Date(s.starts_at).toLocaleDateString("es-PE", {
                          day: "numeric",
                          month: "long",
                          year: "numeric",
                        })}
                    </p>
                    {s.notes && (
                      <p
                        style={{
                          fontSize: "0.86rem",
                          marginTop: 10,
                          marginBottom: 0,
                        }}
                      >
                        {s.notes}
                      </p>
                    )}
                  </div>
                </article>
              );
            })}
          </div>

          <p style={{ marginTop: 40, textAlign: "center" }}>
            <Link href="/" className="back-link">
              ← Volver al inicio
            </Link>
          </p>
        </div>
      </main>

      <SiteFooter />
    </>
  );
}
