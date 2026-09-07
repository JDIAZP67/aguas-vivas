import { redirect } from "next/navigation";
import AdminShell from "@/components/AdminShell";
import ConfigForm from "@/components/ConfigForm";
import { hasAuthConfigured, getAdminProfile } from "@/lib/auth";
import { getDemoProfile } from "@/lib/demo-auth";
import { getTenant } from "@/lib/data";
import { getAdminTenantSlug } from "@/lib/tenant";
import { roleAllows } from "@/lib/roles";
import type { Profile } from "@/lib/types";

export const metadata = {
  title: "Configuración de la iglesia",
};

export default async function ConfiguracionPage() {
  const useReal = hasAuthConfigured();
  const realProfile = useReal ? await getAdminProfile() : null;
  const demoProfile = useReal ? null : await getDemoProfile();
  const demo = !useReal && demoProfile !== null;

  if (useReal && !realProfile) redirect("/acceso");
  if (!useReal && !demoProfile) redirect("/acceso");
  if (realProfile && !roleAllows(realProfile.role, "configuracion")) redirect("/admin");

  const profile: Profile | null = realProfile ?? (demo ? demoProfile : null);
  const slug = await getAdminTenantSlug();
  const tenant = await getTenant(slug);

  return (
    <AdminShell
      active="/admin/configuracion"
      profile={profile}
      tenantName={tenant?.name ?? "Aguas Vivas"}
    >
      <div className="page-head">
        <div>
          <div className="page-eyebrow">Configuración de la iglesia</div>
          <h1>Información, logo y contacto</h1>
        </div>
      </div>

      <p className="subhead" style={{ marginBottom: 20 }}>
        Estos datos identifican a tu congregación en el sitio público:
        nombre, logo, características y datos de contacto.
      </p>

      {tenant ? (
        <ConfigForm tenant={tenant} />
      ) : (
        <div className="perm-note">
          <span>⚠️</span>
          <div>
            <b>No se encontró la iglesia</b>
            Asegúrate de haber ejecutado <code>neon/schema.sql</code> en la
            base de datos.
          </div>
        </div>
      )}
    </AdminShell>
  );
}