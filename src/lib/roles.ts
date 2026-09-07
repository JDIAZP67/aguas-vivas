import type { AppRole } from "./types";

export const SECTION_ALLOW = {
  iglesias: ["super_admin"] as AppRole[],
  mayordomia: ["super_admin", "pastor", "tesoreria"] as AppRole[],
  estudios: ["super_admin", "pastor", "maestro"] as AppRole[],
  contenido: ["super_admin", "pastor", "maestro"] as AppRole[],
  configuracion: ["super_admin", "pastor"] as AppRole[],
  miembros: ["super_admin", "pastor"] as AppRole[],
  decisiones: ["super_admin", "pastor"] as AppRole[],
} as const;

export type AdminSection = keyof typeof SECTION_ALLOW;

export function roleAllows(
  role: AppRole | undefined | null,
  section: AdminSection,
): boolean {
  if (!role) return false;
  return (SECTION_ALLOW[section] as readonly AppRole[]).includes(role);
}

export const PANEL_MEMBER_ROLES = ["pastor", "tesoreria", "maestro"] as const;