import Link from "next/link";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import LiveSection from "@/components/LiveSection";
import { getTenant, isDemoMode } from "@/lib/data";
import { DEMO_LIVE_SESSION, DEMO_TENANT, DEMO_UPCOMING } from "@/lib/demo-data";
import type { Session } from "@/lib/types";

export default async function Home() {
  let liveSession: Session | null = null;
  let upcoming: Session[] = [];
  let tenantName: string | undefined;

  const demo = isDemoMode();
  const demoTenant = demo ? DEMO_TENANT : await getTenant();
  tenantName = demoTenant?.name;

  if (demo) {
    liveSession = DEMO_LIVE_SESSION;
    upcoming = DEMO_UPCOMING;
  }

  try {
    const { hasDatabase, listSessions } = await import("@/lib/db");
    if (hasDatabase()) {
      const all = await listSessions();
      const now = Date.now();
      liveSession = all.find((s) => s.status === "en_vivo") ?? null;
      upcoming = all
        .filter((s) => s.status === "programada")
        .filter((s) => !s.starts_at || new Date(s.starts_at).getTime() >= now)
        .slice(0, 3);
    }
  } catch {}

  return (
    <>
      <SiteHeader />

      <main>
        <section className="hero">
          <div className="hero-content">
            <div className="eyebrow">Plataforma digital · {tenantName ?? "Aguas Vivas"}</div>
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
            <LiveSection liveSession={liveSession} upcoming={upcoming} />
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
