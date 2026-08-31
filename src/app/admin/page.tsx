import { redirect } from "next/navigation";
import Link from "next/link";
import { isDemoMode } from "@/lib/data";
import { getDemoProfile } from "@/lib/demo-auth";
import { getAdminProfile } from "@/lib/auth";
import { DEFAULT_TENANT_SLUG } from "@/lib/constants";
import type { Profile } from "@/lib/types";
import AdminShell from "@/components/AdminShell";

export const metadata = {
  title: "Panel de administración",
};

export default async function AdminPage() {
  const { hasAuthConfigured } = await import("@/lib/auth");
  const realProfile = await getAdminProfile();
  const useReal = hasAuthConfigured();
  const demoProfile = useReal ? null : await getDemoProfile();
  const demo = !useReal && demoProfile !== null;

  if (useReal && !realProfile) redirect("/acceso");
  if (!useReal && !demoProfile) redirect("/acceso");

  let profile: Profile | null = null;
  let tenantName: string | undefined;

  if (realProfile) {
    profile = realProfile;
    tenantName = "Aguas Vivas";
  } else if (demo) {
    profile = demoProfile;
    tenantName = "Aguas Vivas (Demo)";
  }

  return (
    <AdminShell active="/admin" profile={profile} tenantName={tenantName}>
      <div className="page-head">
        <div>
          <div className="page-eyebrow">Configuración de la iglesia</div>
          <h1>{tenantName}</h1>
        </div>
      </div>

      <div className="perm-note" style={{ marginBottom: 24 }}>
        <span>{demo ? "🧪" : "✅"}</span>
        <div>
          <b>{demo ? "Modo demostración" : "Acceso por clave maestra"}</b>
          <br />
          {demo
            ? "Estás en el panel con datos de ejemplo. Para ver dónde cargas y gestionas los videos, entra a «Contenido & video»."
            : "Has entrado con tu clave maestra. Aquí gestionas las transmisiones, clases y grabaciones (videos) del sitio."}
        </div>
      </div>

      <p className="subhead" style={{ marginBottom: 20 }}>
        El panel completo (configuración, decisiones de fe y finanzas) está
        pendiente de migrar a la nueva base de datos. Puedes gestionar el
        contenido audiovisual en el módulo «Contenido &amp; video».
      </p>

      <Link
        href="/admin/en-vivo"
        style={{ color: "var(--sky-mid)", fontWeight: 700 }}
      >
        Ir a Contenido &amp; video (subir videos) →
      </Link>
    </AdminShell>
  );
}
