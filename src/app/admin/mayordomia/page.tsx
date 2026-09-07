import { redirect } from "next/navigation";
import AdminShell from "@/components/AdminShell";
import StewardshipManager from "@/components/StewardshipManager";
import { getDemoProfile } from "@/lib/demo-auth";
import { getAdminProfile } from "@/lib/auth";
import { getAdminTenantSlug, getTenantNameBySlug } from "@/lib/tenant";
import type { Profile } from "@/lib/types";
import type { Transaction } from "@/lib/types";

export const metadata = {
  title: "Mayordomía — Panel",
};

const MONTHS = [
  "enero", "febrero", "marzo", "abril", "mayo", "junio",
  "julio", "agosto", "setiembre", "octubre", "noviembre", "diciembre",
];

function monthBounds(mes: string) {
  const [y, m] = mes.split("-").map(Number);
  const start = new Date(Date.UTC(y, m - 1, 1));
  const end = new Date(Date.UTC(y, m, 1));
  return { start: start.toISOString(), end: end.toISOString() };
}

function shiftMonth(mes: string, delta: number) {
  const [y, m] = mes.split("-").map(Number);
  const d = new Date(Date.UTC(y, m - 1 + delta, 1));
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`;
}

export default async function MayordomiaPage({
  searchParams,
}: {
  searchParams: Promise<{ mes?: string }>;
}) {
  const { hasAuthConfigured } = await import("@/lib/auth");
  const realProfile = await getAdminProfile();
  const useReal = hasAuthConfigured();
  const demoProfile = useReal ? null : await getDemoProfile();
  const demo = !useReal && demoProfile !== null;

  if (useReal && !realProfile) redirect("/acceso");
  if (!useReal && !demoProfile) redirect("/acceso");

  const sessionUser = (realProfile ?? demoProfile) as Profile | null;
  let tenantName: string | undefined = useReal
    ? await getTenantNameBySlug(await getAdminTenantSlug())
    : "Aguas Vivas (Demo)";

  const params = await searchParams;
  const now = new Date();
  const currentMes = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  const mes = /^\d{4}-\d{2}$/.test(params.mes ?? "") ? params.mes! : currentMes;
  const { start, end } = monthBounds(mes);

  let transactions: Transaction[] = [];
  if (useReal && realProfile) {
    try {
      const { listTransactions } = await import("@/lib/db");
      const slug = await getAdminTenantSlug();
      transactions = await listTransactions(slug, start, end);
    } catch {}
  }

  // Totales: ingresos confirmados vs egresos aprobados
  let ingresos = 0;
  let egresos = 0;
  for (const t of transactions) {
    const amt = Number(t.amount) || 0;
    if (t.kind === "ingreso" && t.status === "confirmado") ingresos += amt;
    if (t.kind === "egreso" && t.approval_status === "aprobado") egresos += amt;
  }

  const [yearNum, monthNum] = mes.split("-").map(Number);
  const monthLabel = `${MONTHS[monthNum - 1]} ${yearNum}`;
  const prevHref = `/admin/mayordomia?mes=${shiftMonth(mes, -1)}`;
  const nextHref = `/admin/mayordomia?mes=${shiftMonth(mes, 1)}`;

  return (
    <AdminShell active="/admin/mayordomia" profile={sessionUser} tenantName={tenantName}>
      <div className="page-head">
        <div>
          <div className="section-eyebrow">Mayordomía</div>
          <h1>Diezmos, ofrendas y gastos</h1>
          <p>
            Registro transparente de las finanzas de la iglesia. Los egresos
            requieren aprobación pastoral antes de ejecutarse.
          </p>
        </div>
      </div>

      {demo && (
        <div className="perm-note" style={{ marginBottom: 24 }}>
          <span>🧪</span>
          <div>
            <b>Modo demostración</b>
            Los movimientos aún no se guardan en base de datos.
          </div>
        </div>
      )}

      <StewardshipManager
        monthLabel={monthLabel}
        prevHref={prevHref}
        nextHref={nextHref}
        transactions={transactions}
        totals={{ ingresos, egresos, balance: ingresos - egresos }}
        canApprove
      />
    </AdminShell>
  );
}