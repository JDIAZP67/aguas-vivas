import Link from "next/link";
import { getTenant } from "@/lib/data";
import MobileNav from "@/components/MobileNav";

export default async function SiteHeader() {
  const tenant = await getTenant();
  const name = tenant?.name ?? "Aguas Vivas";
  const logo = tenant?.logo_url || null;

  return (
    <header className="public-header">
      <div className="nav-wrap">
        <Link href="/" className="brand">
          {logo ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={logo}
              alt={`Logo de ${name}`}
              className="brand-logo"
            />
          ) : (
            <span className="brand-mark" />
          )}
          {name}
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
        <MobileNav />
      </div>
    </header>
  );
}