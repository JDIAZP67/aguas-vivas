import { redirect } from "next/navigation";
import AdminShell from "@/components/AdminShell";
import ChurchesManager from "@/components/ChurchesManager";
import { hasAuthConfigured, getAdminProfile } from "@/lib/auth";
import { getDemoProfile } from "@/lib/demo-auth";
import { listTenants } from "@/lib/db";
import { getAdminTenantSlug } from "@/lib/tenant";
import type { Profile, Tenant } from "@/lib/types";

export const metadata = {
  title: "Iglesias — Súper Admin",
};

export default async function IglesiasPage() {
  const useReal = hasAuthConfigured();
  const realProfile = useReal ? await getAdminProfile() : null;
  const demoProfile = useReal ? null : await getDemoProfile();
  const demo = !useReal && demoProfile !== null;

  if (useReal && !realProfile) redirect("/acceso");
  if (!useReal && !demoProfile) redirect("/acceso");

  const profile: Profile | null = realProfile ?? (demo ? demoProfile : null);

  let tenants: Tenant[] = [];
  let activeSlug = "aguas-vivas";

  if (realProfile) {
    try {
      tenants = await listTenants();
      activeSlug = await getAdminTenantSlug();
    } catch {
      tenants = [];
    }
  }

  return (
    <AdminShell active="/admin/iglesias" profile={profile} tenantName="Súper Admin">
      <div className="page-head">
        <div>
          <div className="page-eyebrow">Multi-iglesia</div>
          <h1>Iglesias</h1>
        </div>
      </div>

      {demo && (
        <div className="perm-note" style={{ marginBottom: 24 }}>
          <span>🧪</span>
          <div>
            <b>Modo demostración</b>
            Conecta tu base de datos (DATABASE_URL) para gestionar iglesias.
          </div>
        </div>
      )}

      <p className="subhead" style={{ marginBottom: 20 }}>
        Crea iglesias con tu clave maestra. Cada una usa su propio dominio y
        administra su contenido, finanzas y estudios por separado. Usa
        «Gestionar» para trabajar sobre la iglesia seleccionada.
      </p>

      <ChurchesManager tenants={tenants} activeSlug={activeSlug} />
    </AdminShell>
  );
}