import { cookies } from "next/headers";
import { DEFAULT_TENANT_SLUG } from "@/lib/constants";
import { isDemoMode } from "@/lib/data";

export const ACTIVE_TENANT_COOKIE = "av_tenant";

const FALLBACK_NAME = "Aguas Vivas";
const LOCAL_HOST_RE = /^(localhost|127\.0\.0\.1|0\.0\.0\.0)(:\d+)?$/;
const TENANT_SLUG_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export function searchParamSlug(value: string | string[] | undefined): string | null {
  if (Array.isArray(value)) return value[0] ?? null;
  return value?.trim() || null;
}

export function hostFromHeaders(h: Headers): string {
  return h.get("x-forwarded-host") ?? h.get("host") ?? "";
}

/**
 * Resuelve la iglesia activa para el sitio PÚBLICO, siguiendo este orden:
 * 1. Query `?iglesia=<slug>` (override explícito, para probar en local)
 * 2. Header `x-av-tenant-slug` (inyectado por middleware si se usa)
 * 3. Dominio propio (Header Host) si coincide con tenants.primary_domain
 * 4. Falback: iglesia por defecto (aguas-vivas)
 */
export async function resolveTenantSlugForRequest(
  h: Headers,
  overrideSlug?: string | null,
): Promise<string> {
  if (isDemoMode()) return DEFAULT_TENANT_SLUG;

  try {
    const override = overrideSlug?.trim() || h.get("x-av-tenant-slug");
    if (override && TENANT_SLUG_RE.test(override)) {
      const { tenantExists } = await import("@/lib/db");
      if (await tenantExists(override)) return override;
    }

    const host = hostFromHeaders(h).toLowerCase();
    const domain = host.replace(/:\d+$/, "").replace(/^www\./, "");
    if (domain && !LOCAL_HOST_RE.test(domain) && domain.includes(".")) {
      const { getTenantByDomain } = await import("@/lib/db");
      const byDomain = await getTenantByDomain(domain);
      if (byDomain) return byDomain;
    }
  } catch {}

  return DEFAULT_TENANT_SLUG;
}

/**
 * Resuelve la iglesia activa para el PANEL de administración:
 * cookie `av_tenant` (la cambia el súper-admin en /admin/iglesias) o la por defecto.
 */
export async function getAdminTenantSlug(): Promise<string> {
  if (isDemoMode()) return DEFAULT_TENANT_SLUG;
  try {
    const store = await cookies();

    // Perfil de miembro (pastor/tesoreria/maestro) → la iglesia de su cuenta
    const { getAdminProfile } = await import("@/lib/auth");
    const profile = await getAdminProfile();
    if (profile && profile.role !== "super_admin" && profile.tenant_id) return profile.tenant_id;

    // Clave maestra: cookie `av_tenant` (la cambia el súper-admin) o la por defecto
    const slug = store.get(ACTIVE_TENANT_COOKIE)?.value;
    if (slug && TENANT_SLUG_RE.test(slug) && slug !== DEFAULT_TENANT_SLUG) {
      const { tenantExists } = await import("@/lib/db");
      if (await tenantExists(slug)) return slug;
    }
  } catch {}
  return DEFAULT_TENANT_SLUG;
}

export async function getTenantNameBySlug(slug: string): Promise<string> {
  try {
    if (!process.env.DATABASE_URL) return FALLBACK_NAME;
    const { getTenantName: dbName } = await import("@/lib/db");
    return (await dbName(slug)) || FALLBACK_NAME;
  } catch {
    return FALLBACK_NAME;
  }
}