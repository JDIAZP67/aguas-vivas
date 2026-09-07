import { redirect } from "next/navigation";
import AdminShell from "@/components/AdminShell";
import DecisionsManager from "@/components/DecisionsManager";
import { hasAuthConfigured, getAdminProfile } from "@/lib/auth";
import { getDemoProfile } from "@/lib/demo-auth";
import { listDecisions, countDecisionsByStatus } from "@/lib/db";
import { getAdminTenantSlug, getTenantNameBySlug } from "@/lib/tenant";
import { roleAllows } from "@/lib/roles";
import type { Profile } from "@/lib/types";
import type { SalvationDecision } from "@/lib/types";

export const metadata = {
  title: "Decisiones — Panel",
};

export default async function DecisionesPage() {
  const useReal = hasAuthConfigured();
  const realProfile = useReal ? await getAdminProfile() : null;
  const demoProfile = useReal ? null : await getDemoProfile();
  const demo = !useReal && demoProfile !== null;

  if (useReal && !realProfile) redirect("/acceso");
  if (!useReal && !demoProfile) redirect("/acceso");
  if (realProfile && !roleAllows(realProfile.role, "decisiones")) redirect("/admin");

  const profile: Profile | null = realProfile ?? (demo ? demoProfile : null);

  let decisions: SalvationDecision[] = [];
  let counts: Record<string, number> = {};
  let tenantName = "Aguas Vivas (Demo)";

  if (realProfile) {
    const activeSlug = await getAdminTenantSlug();
    tenantName = (await getTenantNameBySlug(activeSlug)) || activeSlug;
    try {
      decisions = await listDecisions(activeSlug);
      counts = await countDecisionsByStatus(activeSlug);
    } catch {
      decisions = [];
    }
  }

  return (
    <AdminShell active="/admin/decisiones" profile={profile} tenantName={tenantName}>
      <div className="page-head">
        <div>
          <div className="page-eyebrow">Personas que quisieron seguir a Jesús</div>
          <h1>Decisiones de fe</h1>
        </div>
      </div>

      {demo && (
        <div className="perm-note" style={{ marginBottom: 24 }}>
          <span>🧪</span>
          <div>
            <b>Modo demostración</b>
            Las decisiones se registran cuando la base de datos está conectada.
          </div>
        </div>
      )}

      <DecisionsManager
        decisions={decisions}
        counts={counts}
        editable={realProfile?.role === "super_admin" || realProfile?.role === "pastor"}
        tenantId={realProfile?.tenant_id ?? null}
      />
    </AdminShell>
  );
}