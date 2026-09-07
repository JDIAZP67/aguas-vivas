import Link from "next/link";
import type { ReactNode } from "react";
import LogoutButton from "./LogoutButton";
import { ROLE_LABELS, type AppRole, type Profile } from "@/lib/types";

type NavItem = { href: string; label: string };

const ALL_NAV: NavItem[] = [
  { href: "/admin", label: "Panel general" },
  { href: "/admin/iglesias", label: "Iglesias" },
  { href: "/admin/miembros", label: "Miembros" },
  { href: "/admin/decisiones", label: "Decisiones" },
  { href: "/admin/en-vivo", label: "Contenido & video" },
  { href: "/admin/mayordomia", label: "Mayordomía" },
  { href: "/admin/estudios", label: "Niveles de estudio" },
  { href: "/admin/configuracion", label: "Configuración" },
];

const NAV_BY_ROLE: Record<AppRole, string[]> = {
  super_admin: ALL_NAV.map((n) => n.href),
  pastor: [
    "/admin",
    "/admin/miembros",
    "/admin/decisiones",
    "/admin/en-vivo",
    "/admin/mayordomia",
    "/admin/estudios",
    "/admin/configuracion",
  ],
  maestro: ["/admin", "/admin/en-vivo", "/admin/estudios"],
  tesoreria: ["/admin", "/admin/mayordomia"],
  mantenimiento: ["/admin", "/admin/en-vivo"],
  miembro: [],
};

const ROLE_DESC: Record<AppRole, string> = {
  super_admin: "Acceso total: todas las iglesias, miembros, contenido, mayordomía y configuración.",
  pastor: "Administras esta iglesia: miembros, contenido, mayordomía, estudios y configuración.",
  maestro: "Gestionas el contenido audiovisual y los niveles de estudio de esta iglesia.",
  tesoreria: "Gestionas diezmos, ofrendas y gastos; no puedes aprobar egresos.",
  mantenimiento: "Acceso técnico al contenido y video.",
  miembro: "Solo acceso de miembro (sin panel).",
};

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
  const role: AppRole = profile?.role ?? "miembro";
  const navHrefs = NAV_BY_ROLE[role] ?? [];
  const nav = ALL_NAV.filter((item) => navHrefs.includes(item.href));

  return (
    <div className="app">
      <aside className="sidebar">
        <Link href="/" className="side-brand">
          <span className="mark" />
          <span>{name}</span>
        </Link>

        <ul className="side-nav">
          {nav.map((item) => (
            <li key={item.label}>
              <Link
                href={item.href}
                className={item.href === active ? "active" : ""}
              >
                <span className="dot" />
                {item.label}
              </Link>
            </li>
          ))}
        </ul>

        <div className="role-card">
          <div className="label">Rol actual</div>
          <div className="role-name">
            {profile ? ROLE_LABELS[role] : "Miembro"}
          </div>
          <p>{ROLE_DESC[role]}</p>
          <LogoutButton />
        </div>
      </aside>

      <main className="admin-main">
        {profile &&
          role === "tesoreria" &&
          !["/admin", "/admin/mayordomia"].includes(active) && (
            <div className="perm-note" style={{ marginBottom: 24 }}>
              <span>⚠️</span>
              <div>
                <b>Tu rol es "{ROLE_LABELS[role]}"</b>
                No puedes ver esta sección.
              </div>
            </div>
          )}
        {children}
      </main>
    </div>
  );
}