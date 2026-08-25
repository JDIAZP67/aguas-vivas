import Link from "next/link";
import type { ReactNode } from "react";
import LogoutButton from "./LogoutButton";
import { ROLE_LABELS, type Profile } from "@/lib/types";

const NAV = [
  { href: "/admin", label: "Panel general" },
  { href: "/admin/en-vivo", label: "Contenido & video" },
  { href: "/admin/mayordomia", label: "Mayordomía" },
  { href: null, label: "Niveles de estudio 🔒" },
  { href: null, label: "Configuración" },
];

export default function AdminShell({
  active,
  profile,
  children,
}: {
  active: string;
  profile: Profile | null;
  children: ReactNode;
}) {
  return (
    <div className="app">
      <aside className="sidebar">
        <Link href="/" className="side-brand">
          <span className="mark" />
          <span>Aguas Vivas</span>
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
            Los módulos con candado se activan en fases siguientes del proyecto.
          </p>
          <LogoutButton />
        </div>
      </aside>

      <main className="admin-main">{children}</main>
    </div>
  );
}
