import { redirect } from "next/navigation";
import AdminShell from "@/components/AdminShell";
import MembersManager from "@/components/MembersManager";
import { hasAuthConfigured, getAdminProfile } from "@/lib/auth";
import { getDemoProfile } from "@/lib/demo-auth";
import { listMembers, completedLessonIds, countTenantLessons } from "@/lib/db";
import { getAdminTenantSlug, getTenantNameBySlug } from "@/lib/tenant";
import { roleAllows } from "@/lib/roles";
import type { Profile } from "@/lib/types";
import type { Member } from "@/lib/types";

export const metadata = {
  title: "Miembros — Panel",
};

export default async function MiembrosPage() {
  const useReal = hasAuthConfigured();
  const realProfile = useReal ? await getAdminProfile() : null;
  const demoProfile = useReal ? null : await getDemoProfile();
  const demo = !useReal && demoProfile !== null;

  if (useReal && !realProfile) redirect("/acceso");
  if (!useReal && !demoProfile) redirect("/acceso");
  if (realProfile && !roleAllows(realProfile.role, "miembros")) redirect("/admin");

  const profile: Profile | null = realProfile ?? (demo ? demoProfile : null);

  let members: Member[] = [];
  let tenantName = "Aguas Vivas (Demo)";
  let activeSlug = "aguas-vivas";
  let lessonTotals: Record<string, number> = {};
  let doneTotals: Record<string, number> = {};

  if (realProfile) {
    activeSlug = await getAdminTenantSlug();
    tenantName = (await getTenantNameBySlug(activeSlug)) || activeSlug;
    try {
      members = await listMembers(activeSlug);
      const totalLessons = await countTenantLessons(activeSlug);
      for (const m of members) {
        lessonTotals[m.id] = totalLessons;
        try {
          doneTotals[m.id] = (await completedLessonIds(m.id)).length;
        } catch {
          doneTotals[m.id] = 0;
        }
      }
    } catch {
      members = [];
    }
  }

  return (
    <AdminShell active="/admin/miembros" profile={profile} tenantName={tenantName}>
      <div className="page-head">
        <div>
          <div className="page-eyebrow">Miembros de la iglesia</div>
          <h1>Miembros</h1>
        </div>
      </div>

      {demo && (
        <div className="perm-note" style={{ marginBottom: 24 }}>
          <span>🧪</span>
          <div>
            <b>Modo demostración</b>
            Los miembros se gestionan cuando la base de datos está conectada.
          </div>
        </div>
      )}

      <MembersManager
        members={members}
        lessonTotals={lessonTotals}
        doneTotals={doneTotals}
        allowPreview={realProfile?.role === "super_admin" || realProfile?.role === "pastor"}
      />
    </AdminShell>
  );
}