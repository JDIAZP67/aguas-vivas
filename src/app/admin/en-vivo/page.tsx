import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { DEFAULT_TENANT_SLUG } from "@/lib/constants";
import { isDemoMode } from "@/lib/data";
import { getDemoProfile } from "@/lib/demo-auth";
import { DEMO_LIVE_SESSION, DEMO_UPCOMING, DEMO_RECORDINGS } from "@/lib/demo-data";
import type { Profile, Session } from "@/lib/types";
import AdminShell from "@/components/AdminShell";
import SessionsManager from "@/components/SessionsManager";

export const metadata = {
  title: "Contenido & video",
};

export default async function AdminEnVivoPage() {
  const demoProfile = await getDemoProfile();
  const demo = isDemoMode() && demoProfile !== null;

  if (isDemoMode() && !demoProfile) redirect("/acceso");

  if (demo) {
    return (
      <AdminShell active="/admin/en-vivo" profile={demoProfile} tenantName="Aguas Vivas (Demo)">
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
        <div className="perm-note" style={{ marginBottom: 24 }}>
          <span>🧪</span>
          <div>
            <b>Modo demostración</b>
            Estás viendo el panel con datos de ejemplo y cambios que no se
            guardan en base de datos. Cuando conectes tu base de datos, aquí
            cargarás tus videos reales.
          </div>
        </div>
        <SessionsManager
          initialSessions={[DEMO_LIVE_SESSION, ...DEMO_UPCOMING, ...DEMO_RECORDINGS]}
          canEdit
        />
      </AdminShell>
    );
  }

  const supabase = await createClient();

  let user = null;
  try {
    const {
      data: { user: u },
    } = await supabase.auth.getUser();
    user = u;
  } catch {
    user = null;
  }

  if (!user) redirect("/acceso");

  let profile: Profile | null = null;
  try {
    const { data } = await supabase
      .from("profiles")
      .select("id, tenant_id, full_name, role")
      .eq("id", user.id)
      .maybeSingle();
    profile = (data as Profile) ?? null;
  } catch {
    profile = null;
  }

  let tenantName: string | undefined;
  let tenantId: string | null = null;
  try {
    const { data } = await supabase
      .from("tenants")
      .select("id, name")
      .eq("slug", DEFAULT_TENANT_SLUG)
      .maybeSingle();
    tenantId = data?.id ?? null;
    tenantName = data?.name ?? undefined;
  } catch {}

  let sessions: Session[] = [];
  if (tenantId && profile && ["super_admin", "pastor", "maestro"].includes(profile.role)) {
    try {
      const { data } = await supabase
        .from("sessions")
        .select(
          "id, tenant_id, title, type, course_id, host_name, starts_at, duration_min, video_url, notes, status",
        )
        .eq("tenant_id", tenantId)
        .order("created_at", { ascending: false });
      sessions = (data as Session[]) ?? [];
    } catch {}
  }

  const canEdit =
    Boolean(profile) &&
    ["super_admin", "pastor", "maestro"].includes(profile!.role);

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

      {!canEdit && (
        <div className="perm-note">
          <span>🔒</span>
          <div>
            <b>Sin permisos de edición</b>
            Solo Pastorado, Maestros o Súper Admin pueden gestionar sesiones.
          </div>
        </div>
      )}

      <SessionsManager initialSessions={sessions} canEdit={canEdit} />
    </AdminShell>
  );
}
