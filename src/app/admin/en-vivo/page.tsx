import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { DEFAULT_TENANT_SLUG } from "@/lib/constants";
import type { Profile, Session } from "@/lib/types";
import AdminShell from "@/components/AdminShell";
import SessionsManager from "@/components/SessionsManager";

export const metadata = {
  title: "Contenido & video — Aguas Vivas",
};

export default async function AdminEnVivoPage() {
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

  let sessions: Session[] = [];
  if (profile && ["super_admin", "pastor", "maestro"].includes(profile.role)) {
    try {
      const { data } = await supabase
        .from("sessions")
        .select(
          "id, tenant_id, title, type, course_id, host_name, starts_at, duration_min, video_url, notes, status",
        )
        .eq("tenant_id", (await supabase.from("tenants").select("id").eq("slug", DEFAULT_TENANT_SLUG).maybeSingle()).data?.id ?? "")
        .order("created_at", { ascending: false });
      sessions = (data as Session[]) ?? [];
    } catch {}
  }

  const canEdit =
    Boolean(profile) &&
    ["super_admin", "pastor", "maestro"].includes(profile!.role);

  return (
    <AdminShell active="/admin/en-vivo" profile={profile}>
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
