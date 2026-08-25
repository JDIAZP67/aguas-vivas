import Link from "next/link";
import type { ReactNode } from "react";
import LogoutButton from "./LogoutButton";
import { ROLE_LABELS, type Profile } from "@/lib/types";

const NAV = [
  { href: "/admin", label: "Panel general" },
  { href: "/admin/en-vivo", label: "Contenido & video" },
  { href: "/admin/mayordomia", label: "Mayordomía" },
  { href: "/admin/estudios", label: "Niveles de estudio" },
  { href: "/admin", label: "Configuración" },
];

export default function AdminShell({
  active,
  profile,
  tenantName,
  children,
}: {
  active: string;
  profile: Profile | null;
  tenantName?: string;
  children: ReactNode;
}) {
  const name = tenantName || "Aguas Vivas";
  return (
    <div className="app">
      <aside className="sidebar">
        <Link href="/" className="side-brand">
          <span className="mark" />
          <span>{name}</span>
        </Link>

        <ul className="side-nav">
          {NAV.map((item) =>
            item.href ? (
              <li key={item.label}>
                <Link
                  href={item.href}
                  className={item.href === active ? "active" : ""}
                >
                  <span className="dot" />
                  {item.label}
                </Link>
              </li>
            ) : (
              <li key={item.label}>
                <a className="locked">
                  <span className="dot" />
                  {item.label}
                </a>
              </li>
            ),
          )}
        </ul>

        <div className="role-card">
          <div className="label">Rol actual</div>
          <div className="role-name">
            {profile ? ROLE_LABELS[profile.role] : "Miembro"}
          </div>
          <p>
            Gestiona la información de tu iglesia, contenido, finanzas y niveles de estudio.
          </p>
          <LogoutButton />
        </div>
      </aside>

      <main className="admin-main">
        {profile && !["super_admin", "pastor", "maestro"].includes(profile.role) && (
          <div className="perm-note" style={{ marginBottom: 24 }}>
            <span>⚠️</span>
            <div>
              <b>Tu rol es "{ROLE_LABELS[profile.role]}"</b>
              No puedes guardar cambios en esta sección. Si eres el administrador,
              ejecuta el script de configuración de roles en el SQL Editor de Supabase.
            </div>
          </div>
        )}
        {children}
      </main>
    </div>
  );
}
