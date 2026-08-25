import Link from "next/link";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import { createClient } from "@/lib/supabase/server";
import { DEFAULT_TENANT_SLUG } from "@/lib/constants";
import { toEmbedUrl } from "@/lib/youtube";
import type { Session } from "@/lib/types";

export default async function Home() {
  let liveSession: Session | null = null;
  let upcoming: Session[] = [];
  let monthTotals: { ingresos: number; egresos: number } | null = null;

  try {
    const supabase = await createClient();
    const { data: tenant } = await supabase
      .from("tenants")
      .select("id")
      .eq("slug", DEFAULT_TENANT_SLUG)
      .maybeSingle();

    if (tenant) {
      const { data: lv } = await supabase
        .from("sessions")
        .select(
          "id, tenant_id, title, type, course_id, host_name, starts_at, duration_min, video_url, notes, status",
        )
        .eq("tenant_id", tenant.id)
        .eq("status", "en_vivo")
        .limit(1);
      liveSession = (lv?.[0] as Session) ?? null;

      const { data: up } = await supabase
        .from("sessions")
        .select(
          "id, tenant_id, title, type, course_id, host_name, starts_at, duration_min, video_url, notes, status",
        )
        .eq("tenant_id", tenant.id)
        .eq("status", "programada")
        .gte("starts_at", new Date().toISOString())
        .order("starts_at", { ascending: true })
        .limit(3);
      upcoming = (up as Session[]) ?? [];

      // Transparencia financiera del mes en curso (solo montos agregados)
      const now = new Date();
      const monthStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
      const { data: txs } = await supabase
        .from("transactions")
        .select("kind, amount, status, approval_status")
        .eq("tenant_id", tenant.id)
        .gte("occurred_at", monthStart.toISOString());
      if (txs) {
        let ingresos = 0;
        let egresos = 0;
        for (const t of txs) {
          const amt = Number(t.amount) || 0;
          if (t.kind === "ingreso" && t.status === "confirmado") ingresos += amt;
          if (t.kind === "egreso" && t.approval_status === "aprobado") egresos += amt;
        }
        monthTotals = { ingresos, egresos };
      }
    }
  } catch {}

  const embed = toEmbedUrl(liveSession?.video_url ?? null);
  return (
    <>
      <SiteHeader />

      <main>
        <section className="hero">
          <div className="hero-content">
            <div className="eyebrow">Plataforma digital · Aguas Vivas</div>
            <h1>
              Un mensaje que <em>cruza los mares</em>,<br />
              hasta lo último de la tierra
            </h1>
            <p>
              Prédicas en vivo, formación bíblica por niveles y una comunidad
              que crece en la fe — todo en un solo lugar, para que el evangelio
              llegue a cada rincón del mundo.
            </p>
            <div className="hero-actions">
              <Link
                className="pbtn pbtn-solid pbtn-lg"
                href="/plan-de-salvacion"
              >
                Conoce el Plan de Salvación
              </Link>
              <a className="pbtn pbtn-ghost pbtn-lg" href="/estudios">
                Comenzar mis estudios
              </a>
            </div>
          </div>
          <div className="verse">
            &quot;Id por todo el mundo y predicad el evangelio a toda
            criatura.&quot;
            <span>MARCOS 16:15</span>
          </div>
          <div className="horizon" />
        </section>

        <section className="block cta-final" id="evangelio">
          <h2>¿Has escuchado del amor de Dios?</h2>
          <p>
            Dios te creó para vivir en comunión con Él. A través de Jesucristo,
            hay un camino de regreso a casa — descúbrelo hoy mismo en pocos
            minutos.
          </p>
          <Link className="pbtn pbtn-solid pbtn-lg" href="/plan-de-salvacion">
            Ver el Plan de Salvación →
          </Link>
        </section>

        <section className="block live" id="vivo">
          <div className="section-inner">
            <div className="section-head">
              <div className="section-eyebrow">Videoconferencia</div>
              <h2>Prédicas, clases y anuncios — en un mismo espacio</h2>
              <p>
                Un solo salón virtual con tres propósitos: predicación
                dominical, clases de los niveles de estudio, y anuncios de la
                congregación.
              </p>
            </div>
            <div className="live-grid">
              {liveSession ? (
                <div className="live-screen">
                  <div className="live-badge">EN VIVO</div>
                  {embed ? (
                    <div
                      style={{
                        position: "absolute",
                        inset: 0,
                        width: "100%",
                        height: "100%",
                      }}
                    >
                      <iframe
                        src={`${embed}?autoplay=1`}
                        title={liveSession.title}
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                        style={{
                          width: "100%",
                          height: "100%",
                          border: "none",
                        }}
                      />
                    </div>
                  ) : (
                    <p className="live-soon" style={{ padding: "0 30px" }}>
                      Estamos transmitiendo:<br />
                      <strong style={{ color: "#fff" }}>{liveSession.title}</strong>
                      <br /><br />
                      Conéctate por el enlace que compartió la iglesia.
                    </p>
                  )}
                  <div
                    style={{
                      position: "absolute",
                      bottom: 16,
                      left: 16,
                      right: 16,
                      display: "flex",
                      justifyContent: "space-between",
                      fontFamily: "var(--font-mono)",
                      fontSize: "0.75rem",
                      color: embed ? "rgba(244,248,250,0)" : "rgba(244,248,250,0.75)",
                    }}
                  >
                    <span>{liveSession.host_name ?? "Pastorado"}</span>
                    <span>{embed ? "" : "transmisión activa"}</span>
                  </div>
                </div>
              ) : (
                <div className="live-screen">
                  {upcoming.length > 0 ? (
                    <>
                      <div className="live-badge" style={{ background: "#1c8a5c" }}>
                        PRÓXIMA SESIÓN
                      </div>
                      <p className="live-soon">
                        <strong style={{ color: "#fff", fontSize: "1rem" }}>
                          {upcoming[0].title}
                        </strong>
                        <br />
                        {upcoming[0].starts_at &&
                          new Date(upcoming[0].starts_at).toLocaleString("es-PE", {
                            weekday: "long",
                            day: "numeric",
                            month: "long",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                      </p>
                      <div
                        style={{
                          position: "absolute",
                          bottom: 16,
                          left: 16,
                          right: 16,
                          display: "flex",
                          justifyContent: "space-between",
                          fontFamily: "var(--font-mono)",
                          fontSize: "0.75rem",
                          color: "rgba(244,248,250,0.75)",
                        }}
                      >
                        <span>{upcoming[0].host_name ?? "Pastorado"}</span>
                        <span>te esperamos</span>
                      </div>
                    </>
                  ) : (
                    <>
                      <p className="live-soon">
                        No hay transmisiones programadas en este momento.
                        <br />
                        Revisa la biblioteca de grabaciones mientras tanto.
                      </p>
                      <Link
                        href="/biblioteca"
                        className="pbtn pbtn-ghost"
                        style={{ position: "relative", zIndex: 3 }}
                      >
                        Ver biblioteca →
                      </Link>
                    </>
                  )}
                </div>
              )}

              <div className="live-tabs">
                {(upcoming.length
                  ? upcoming.slice(0, 3)
                  : [
                      {
                        id: "a",
                        title: "Predicación dominical",
                        type: "predicacion",
                        starts_at: null,
                        notes:
                          "Servicio general — abierto a toda la congregación y visitantes.",
                      } as Session,
                      {
                        id: "b",
                        title: "Clases por nivel",
                        type: "clase",
                        starts_at: null,
                        notes:
                          "Sesiones en vivo para Nivel 1, 2 y 3, con materiales descargables.",
                      } as Session,
                      {
                        id: "c",
                        title: "Anuncios semanales",
                        type: "anuncio",
                        starts_at: null,
                        notes:
                          "Actividades, bautismos, campañas de evangelismo y avisos generales.",
                      } as Session,
                    ]
                ).map((s) => (
                  <div key={s.id} className={`live-tab ${s.id === (upcoming[0]?.id ?? "a") ? "active" : ""}`}>
                    <div className="live-tab-top">
                      <h4>{s.title}</h4>
                      {s.starts_at && (
                        <span className="tag">
                          {new Date(s.starts_at).toLocaleDateString("es-PE", {
                            day: "numeric",
                            month: "short",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>
                      )}
                    </div>
                    <p>{s.notes}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="block" id="niveles">
          <div className="section-inner">
            <div className="section-head">
              <div className="section-eyebrow">Formación bíblica</div>
              <h2>Un camino de crecimiento, paso a paso</h2>
              <p>
                Cada miembro avanza a su propio ritmo por tres niveles, desde
                las verdades básicas hasta la preparación para servir y
                evangelizar.
              </p>
            </div>
            <div className="levels-grid">
              <div className="level-card">
                <span className="level-num">01</span>
                <div className="level-tag">Fundamentos</div>
                <h3>Verdades básicas y bautismo</h3>
                <p>
                  El primer paso en la fe: doctrinas esenciales y preparación
                  para el bautismo en agua.
                </p>
                <ul className="level-topics">
                  <li>Nueva vida en Cristo</li>
                  <li>La Biblia como fundamento</li>
                  <li>Preparación para el bautismo</li>
                </ul>
                <div className="level-foot">
                  Se abre al registrarte como miembro
                </div>
              </div>
              <div className="level-card">
                <span className="level-num">02</span>
                <div className="level-tag">Crecimiento</div>
                <h3>Romanos, Hechos y las epístolas</h3>
                <p>
                  Profundización doctrinal a través del estudio sistemático del
                  Nuevo Testamento.
                </p>
                <ul className="level-topics">
                  <li>Libro de Romanos</li>
                  <li>Hechos de los Apóstoles</li>
                  <li>Mayoría de las epístolas</li>
                </ul>
                <div className="level-foot">
                  Nivel 1 requerido para iniciar
                </div>
              </div>
              <div className="level-card">
                <span className="level-num">03</span>
                <div className="level-tag">Ministerio</div>
                <h3>Seminario y consejería pastoral</h3>
                <p>
                  Formación para el servicio: liderazgo, consejería y
                  evangelismo práctico.
                </p>
                <ul className="level-topics">
                  <li>Seminario bíblico</li>
                  <li>Consejería pastoral</li>
                  <li>Evangelismo I y II</li>
                </ul>
                <div className="level-foot">
                  Se habilita al completar el Nivel 2
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="block stewardship" id="mayordomia">
          <div className="section-inner">
            <div className="section-head">
              <div className="section-eyebrow">Mayordomía</div>
              <h2>Ofrendas y diezmos, con transparencia</h2>
              <p>
                Un registro claro de ingresos y egresos: diezmos, ofrendas,
                pagos pastorales y gastos de operación. Contribuye en línea
                desde cualquier parte del mundo.
              </p>
            </div>
            <div className="stew-grid">
              <div className="stew-card">
                <h3>Transparencia total</h3>
                <p style={{ color: "var(--ink-soft)", lineHeight: 1.65 }}>
                  Cada movimiento financiero de la congregación es registrado
                  por Tesorería y los egresos requieren aprobación del
                  Pastorado, con reportes mensuales exportables.
                </p>
                {monthTotals && (
                  <p style={{ fontSize: "0.85rem", marginBottom: 0 }}>
                    <b>Este mes:</b>{" "}
                    <span className="amount-in">
                      +S/ {monthTotals.ingresos.toFixed(2)}
                    </span>{" "}
                    ·{" "}
                    <span className="amount-out">
                      −S/ {monthTotals.egresos.toFixed(2)}
                    </span>
                  </p>
                )}
              </div>
              <div className="stew-mini">
                <h4>Da tu diezmo u ofrenda en línea</h4>
                <p>
                  Transferencia, Yape, Plin o tarjeta — desde cualquier lugar
                  del mundo. Tu comprobante se genera automáticamente al
                  confirmarse el depósito.
                </p>
                <div
                  style={{
                    display: "flex",
                    gap: 10,
                    flexWrap: "wrap",
                  }}
                >
                  <a href="/donar" className="btn btn-primary" style={{ textDecoration: "none" }}>
                    Dar ahora 💛
                  </a>
                  <a href="#contacto" className="btn btn-secondary" style={{ textDecoration: "none" }}>
                    Preguntar
                  </a>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="block cta-final" id="acerca">
          <h2>El evangelio, sin fronteras</h2>
          <p>
            Esta plataforma existe para que cada persona, en cualquier parte
            del mundo, pueda escuchar el evangelio, crecer en la Palabra y
            encontrar una comunidad de fe.
          </p>
          <Link className="pbtn pbtn-solid pbtn-lg" href="/plan-de-salvacion">
            Comenzar ahora
          </Link>
        </section>
      </main>

      <SiteFooter />
    </>
  );
}
