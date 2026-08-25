import Link from "next/link";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";

export default function Home() {
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
              <div className="live-screen">
                <div className="live-badge">EN VIVO PRÓXIMAMENTE</div>
                <p className="live-soon">
                  El módulo de transmisión en vivo se activará en la Fase 3
                  del proyecto.
                  <br />
                  Mientras tanto, acompáñanos presencialmente.
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
                  <span>Predicación dominical</span>
                  <span>Dom 10:00 am</span>
                </div>
              </div>
              <div className="live-tabs">
                <div className="live-tab active">
                  <div className="live-tab-top">
                    <h4>Predicación dominical</h4>
                    <span className="tag">DOMINGO</span>
                  </div>
                  <p>
                    Servicio general — abierto a toda la congregación y
                    visitantes.
                  </p>
                </div>
                <div className="live-tab">
                  <div className="live-tab-top">
                    <h4>Clases por nivel</h4>
                    <span className="tag">MAR / JUE</span>
                  </div>
                  <p>
                    Sesiones en vivo para Nivel 1, 2 y 3, con materiales
                    descargables.
                  </p>
                </div>
                <div className="live-tab">
                  <div className="live-tab-top">
                    <h4>Anuncios</h4>
                    <span className="tag">SEMANAL</span>
                  </div>
                  <p>
                    Actividades, bautismos, campañas de evangelismo y avisos
                    generales.
                  </p>
                </div>
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
                pagos pastorales y gastos de operación. Muy pronto podrás
                contribuir en línea desde cualquier parte del mundo.
              </p>
            </div>
            <div className="stew-grid">
              <div className="stew-card">
                <h3>Transparencia total</h3>
                <p style={{ color: "var(--ink-soft)", lineHeight: 1.65 }}>
                  Cada movimiento financiero de la congregación será registrado
                  por Tesorería y aprobado por el Pastorado, con reportes
                  mensuales exportables visibles para los miembros.
                </p>
                <span className="phase-note">Módulo activable en Fase 4</span>
              </div>
              <div className="stew-mini">
                <h4>Da tu diezmo u ofrenda en línea</h4>
                <p>
                  Contribuye desde cualquier lugar del mundo, de forma segura,
                  y recibe tu comprobante automáticamente.
                </p>
                <div
                  style={{
                    display: "flex",
                    gap: 10,
                    flexWrap: "wrap",
                  }}
                >
                  <span className="method-chip tag">Transferencia</span>
                  <span className="method-chip tag">Tarjeta</span>
                  <span className="method-chip tag">Billetera digital</span>
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
