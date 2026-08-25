import Link from "next/link";

export default function SiteHeader() {
  return (
    <header className="public-header">
      <div className="nav-wrap">
        <Link href="/" className="brand">
          <span className="brand-mark" />
          Aguas Vivas
        </Link>
        <nav className="main-nav">
          <ul>
            <li>
              <Link href="/plan-de-salvacion">Plan de Salvación</Link>
            </li>
            <li>
              <a href="/#vivo">En vivo</a>
            </li>
            <li>
              <Link href="/estudios">Estudios bíblicos</Link>
            </li>
            <li>
              <a href="/#mayordomia">Mayordomía</a>
            </li>
          </ul>
        </nav>
        <div className="nav-cta">
          <Link className="pbtn pbtn-ghost" href="/acceso">
            Iniciar sesión
          </Link>
          <Link className="pbtn pbtn-solid" href="/plan-de-salvacion">
            Conoce a Jesús
          </Link>
        </div>
      </div>
    </header>
  );
}
