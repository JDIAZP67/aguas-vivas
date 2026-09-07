import Link from "next/link";
import { headers } from "next/headers";
import { getTenant } from "@/lib/data";
import { resolveTenantSlugForRequest } from "@/lib/tenant";
import { getMemberSession } from "@/lib/member-auth";
import MobileNav from "@/components/MobileNav";

export default async function SiteHeader({ slug: slugProp }: { slug?: string } = {}) {
  const slug = slugProp ?? (await resolveTenantSlugForRequest(await headers()));
  const tenant = await getTenant(slug);
  const name = tenant?.name ?? "Aguas Vivas";
  const logo = tenant?.logo_url || null;
  const member = await getMemberSession();

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
          {member ? (
            <>
              <Link className="pbtn pbtn-ghost" href="/mi-perfil">
                Mi perfil
              </Link>
              <Link className="pbtn pbtn-ghost" href="/mi-progreso">
                Mi progreso
              </Link>
              <span className="nav-member-chip" title={member.full_name}>
                {member.full_name.split(" ")[0]}
              </span>
            </>
          ) : (
            <>
              <Link className="pbtn pbtn-ghost" href="/acceso">
                Iniciar sesión
              </Link>
              <Link className="pbtn pbtn-solid" href="/plan-de-salvacion">
                Conoce a Jesús
              </Link>
            </>
          )}
        </div>
        <MobileNav />
      </div>
    </header>
  );
}