import { redirect } from "next/navigation";
import { isDemoMode } from "@/lib/data";
import { getDemoProfile } from "@/lib/demo-auth";
import { getAdminProfile } from "@/lib/auth";
import { DEMO_LIVE_SESSION, DEMO_UPCOMING, DEMO_RECORDINGS } from "@/lib/demo-data";
import type { Profile, Session } from "@/lib/types";
import AdminShell from "@/components/AdminShell";
import SessionsManager from "@/components/SessionsManager";

export const metadata = {
  title: "Contenido & video",
};

export default async function AdminEnVivoPage() {
  const demoProfile = await getDemoProfile();
  const realProfile = await getAdminProfile();
  const demo = isDemoMode() && demoProfile !== null;

  if (isDemoMode() && !demoProfile) redirect("/acceso");
  if (!isDemoMode() && !realProfile) redirect("/acceso");

  let sessions: Session[] = [];
  let profile: Profile | null = null;
  let tenantName: string | undefined;

  if (realProfile) {
    profile = realProfile;
    tenantName = "Aguas Vivas";
    try {
      const { listSessions } = await import("@/lib/db");
      sessions = await listSessions();
    } catch {
      sessions = [];
    }
  }

  if (demo) {
    sessions = [DEMO_LIVE_SESSION, ...DEMO_UPCOMING, ...DEMO_RECORDINGS];
    profile = demoProfile;
    tenantName = "Aguas Vivas (Demo)";
  }

  const canEdit = Boolean(profile);
  const demoBanner = demo ? (
    <div className="perm-note" style={{ marginBottom: 24 }}>
      <span>🧪</span>
      <div>
        <b>Modo demostración</b>
        Estás viendo el panel con datos de ejemplo y cambios que no se guardan
        en base de datos. Cuando conectes tu base de datos (DATABASE_URL), aquí
        cargarás tus videos reales.
      </div>
    </div>
  ) : null;

  return (
    <AdminShell active="/admin/en-vivo" profile={profile} tenantName={tenantName}>
      <div className="page-head">
        <div>
          <div className="page-eyebrow">Contenido &amp; video</div>
          <h1>Transmisiones y clases</h1>
        </div>
      </div>
      <p className="subhead">
        Un solo módulo para tres propósitos: predicación dominical, clases por
        nivel de estudio y anuncios semanales. Lo que marques como «En vivo»
        aparecerá en la página pública con su reproductor.
      </p>
      {demoBanner}
      <SessionsManager initialSessions={sessions} canEdit={canEdit} isDemo={demo} />
    </AdminShell>
  );
}
