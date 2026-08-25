import Link from "next/link";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import SalvationForm from "@/components/SalvationForm";

interface Verse {
  text: string;
  ref: string;
}

const steps: Array<{ title: string; text: string; verses: Verse[] }> = [
  {
    title: "Dios te ama y te creó para Él",
    text: "Desde antes de que nacieras, Dios te amó. Su deseo es que tengas una vida plena y una relación personal con Él, aquí y en la eternidad.",
    verses: [
      {
        text: "Porque de tal manera amó Dios al mundo, que ha dado a su Hijo unigénito, para que todo aquel que en él cree, no se pierda, mas tenga vida eterna.",
        ref: "Juan 3:16",
      },
      {
        text: "El ladrón no viene sino para hurtar y matar y destruir; yo he venido para que tengan vida, y para que la tengan en abundancia.",
        ref: "Juan 10:10",
      },
    ],
  },
  {
    title: "El pecado nos separó de Dios",
    text: "Todos hemos pecado — pensamientos, palabras y acciones que van en contra de Dios. Ese pecado nos separa de Él y nos impide alcanzar la vida eterna por nosotros mismos.",
    verses: [
      {
        text: "por cuanto todos pecaron, y están destituidos de la gloria de Dios,",
        ref: "Romanos 3:23",
      },
      {
        text: "Porque la paga del pecado es muerte, mas la dádiva de Dios es vida eterna en Cristo Jesús Señor nuestro.",
        ref: "Romanos 6:23",
      },
    ],
  },
  {
    title: "Cristo pagó el precio por ti",
    text: "Dios, en su gran amor, envió a su Hijo Jesucristo. Él vivió sin pecado y murió en la cruz pagando la deuda de tu pecado, y resucitó al tercer día venciendo a la muerte.",
    verses: [
      {
        text: "Mas Dios muestra su amor para con nosotros, en que siendo aún pecadores, Cristo murió por nosotros.",
        ref: "Romanos 5:8",
      },
      {
        text: "Porque primeramente os he enseñado lo que asimismo recibí: Que Cristo murió por nuestros pecados, conforme a las Escrituras; y que fue sepultado, y que resucitó al tercer día, conforme a las Escrituras;",
        ref: "1 Corintios 15:3-4",
      },
    ],
  },
  {
    title: "Recíbelo hoy por fe",
    text: "La salvación es un regalo: no se gana con obras ni méritos. Se recibe por fe, arrepintiéndote de tu pecado y creyendo en tu corazón que Jesús es Señor.",
    verses: [
      {
        text: "Porque por gracia sois salvos por medio de la fe; y esto no de vosotros, pues es don de Dios; no por obras, para que nadie se gloríe.",
        ref: "Efesios 2:8-9",
      },
      {
        text: "que si confesares con tu boca que Jesús es el Señor, y creyeres en tu corazón que Dios le levantó de los muertos, serás salvo.",
        ref: "Romanos 10:9",
      },
    ],
  },
];

export const metadata = {
  title: "Plan de Salvación — Aguas Vivas",
  description:
    "Cuatro verdades bíblicas que pueden cambiar tu vida para siempre. Descubre cómo recibir a Jesús hoy.",
};

export default function PlanDeSalvacionPage() {
  return (
    <>
      <SiteHeader />

      <main>
        <section className="salvation-hero">
          <div className="hero-content">
            <div className="eyebrow">El mensaje más importante del mundo</div>
            <h1 style={{ fontFamily: "var(--font-display)", fontWeight: 600 }}>
              El Plan de <em style={{ color: "var(--horizon-glow)" }}>Salvación</em>
            </h1>
            <p>
              Cuatro verdades bíblicas que pueden cambiar tu vida para siempre.
              Léelas con calma — este momento puede ser el nuevo comienzo que
              has estado buscando.
            </p>
          </div>
          <div className="verse">
            &quot;Porque de tal manera amó Dios al mundo, que ha dado a su Hijo
            unigénito, para que todo aquel que en él cree, no se pierda, mas
            tenga vida eterna.&quot;
            <span>JUAN 3:16 · REINA-VALERA 1960</span>
          </div>
        </section>

        <section className="block">
          <div className="section-inner">
            <div className="steps-grid">
              {steps.map((s, i) => (
                <article key={i} className="step-card">
                  <span className="step-num">{i + 1}</span>
                  <h3>{s.title}</h3>
                  <p>{s.text}</p>
                  <div className="step-verse">
                    {s.verses.map((v, j) => (
                      <blockquote key={j}>
                        <p>&quot;{v.text}&quot;</p>
                        <cite>{v.ref}</cite>
                      </blockquote>
                    ))}
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="block" style={{ paddingTop: 0 }}>
          <div className="prayer-box">
            <h3>¿Quieres recibir a Jesús en tu corazón?</h3>
            <blockquote>
              &quot;Señor Jesús, reconozco que soy pecador y necesito tu
              perdón. Creo que moriste en la cruz por mí y que resucitaste.
              Hoy me arrepiento de mis pecados y te recibo como mi Señor y
              Salvador. Transforma mi vida y guíame desde ahora en adelante.
              Amén.&quot;
            </blockquote>
            <p
              style={{
                fontSize: "0.9rem",
                color: "rgba(244,248,250,0.75)",
                lineHeight: 1.7,
                marginBottom: 26,
              }}
            >
              Si oraste esta oración con sinceridad,{" "}
              <strong>¡bienvenido a la familia de Dios!</strong> Queremos
              acompañarte en este nuevo camino. Déjanos tus datos y un líder de
              nuestra iglesia se pondrá en contacto contigo.
            </p>

            <div
              style={{
                borderTop: "1px solid rgba(244,248,250,0.18)",
                paddingTop: 26,
                marginBottom: 30,
              }}
            >
              <p
                style={{
                  fontFamily: "var(--font-display)",
                  fontStyle: "italic",
                  fontSize: "1.05rem",
                  lineHeight: 1.7,
                  color: "var(--horizon-glow)",
                }}
              >
                &quot;porque todo aquel que invocare el nombre del Señor,
                será salvo.&quot;
              </p>
              <span
                style={{
                  display: "block",
                  marginTop: 8,
                  fontFamily: "var(--font-mono)",
                  fontSize: "0.72rem",
                  letterSpacing: "1.5px",
                  color: "rgba(244,248,250,0.65)",
                }}
              >
                ROMANOS 10:13 · REINA-VALERA 1960
              </span>
            </div>

            <a className="pbtn pbtn-solid pbtn-lg" href="#decision">
              Registré mi decisión de fe ↓
            </a>
          </div>
        </section>

        <section className="block decision-section" id="decision">
          <div className="section-inner">
            <div className="section-head" style={{ marginLeft: "auto", marginRight: "auto", textAlign: "center", maxWidth: 640 }}>
              <div className="section-eyebrow" style={{ justifyContent: "center" }}>
                Siguiente paso
              </div>
              <h2>Tu decisión importa</h2>
              <p>
                Completa el formulario y nuestro equipo pastoral te escribirá
                para regalarte material de crecimiento, invitarte a los
                estudios bíblicos y caminar contigo.
              </p>
            </div>
            <SalvationForm />
          </div>
        </section>

        <section className="block cta-final">
          <h2>Nuevo comienzo, nueva familia</h2>
          <p>
            La fe crece en comunidad. Regístrate como miembro y comienza hoy
            mismo el Nivel 1 de formación bíblica, completamente gratis.
          </p>
          <Link className="pbtn pbtn-solid pbtn-lg" href="/acceso">
            Crear mi cuenta de miembro
          </Link>
        </section>
      </main>

      <SiteFooter />
    </>
  );
}
