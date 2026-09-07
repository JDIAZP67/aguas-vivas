import { cookies } from "next/headers";
import type { Profile } from "./types";
import { isDemoMode } from "./data";

export const ADMIN_AUTH_COOKIE = "av_admin_auth";
export const ADMIN_KEY = process.env.ADMIN_KEY ?? "";

export function hasAuthConfigured(): boolean {
  return Boolean(process.env.DATABASE_URL);
}

/**
 * Perfil del panel:
 * - Clave maestra  → super_admin sobre la iglesia raíz.
 * - Sesión de miembro con rol pastor/tesoreria/maestro → perfil de esa iglesia.
 * - Cualquier otro caso → null.
 */
export async function getAdminProfile(): Promise<Profile | null> {
  if (!hasAuthConfigured() || isDemoMode()) return null;
  const store = await cookies();

  // Clave maestra
  if (store.get(ADMIN_AUTH_COOKIE)?.value === "1") {
    return {
      id: "admin",
      tenant_id: "aguas-vivas",
      full_name: "Administrador",
      role: "super_admin",
    };
  }

  // Sesión de miembro con rol directivo
  const { getMemberSession } = await import("@/lib/member-auth");
  const member = await getMemberSession();
  if (!member) return null;
  if (member.role === "miembro") return null;

  return {
    id: member.id,
    tenant_id: member.tenant_id,
    full_name: member.full_name,
    role: member.role,
  };
}

/** Id interno de la cuenta administrada (para progreso, etc.). */
export async function getAdminAccountId(): Promise<string> {
  const profile = await getAdminProfile();
  return profile?.id ?? "admin";
}