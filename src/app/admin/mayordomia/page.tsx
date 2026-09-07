import { redirect } from "next/navigation";
import AdminShell from "@/components/AdminShell";
import StewardshipManager from "@/components/StewardshipManager";
import StewardshipReports from "@/components/StewardshipReports";
import { getDemoProfile } from "@/lib/demo-auth";
import { getAdminProfile } from "@/lib/auth";
import { getAdminTenantSlug, getTenantNameBySlug } from "@/lib/tenant";
import { roleAllows } from "@/lib/roles";
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
  if (realProfile && !roleAllows(realProfile.role, "mayordomia")) redirect("/admin");

  const sessionUser = (realProfile ?? demoProfile) as Profile | null;
  let tenantName: string | undefined = useReal
    ? await getTenantNameBySlug(await getAdminTenantSlug())
    : "Aguas Vivas (Demo)";

  const params = await searchParams;
  const now = new Date();
  const currentMes = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  const mes = /^\d{4}-\d{2}$/.test(params.mes ?? "") ? params.mes! : currentMes;
  const { start, end } = monthBounds(mes);

  const [yearNum, monthNum] = mes.split("-").map(Number);
  const monthLabel = `${MONTHS[monthNum - 1]} ${yearNum}`;
  const prevHref = `/admin/mayordomia?mes=${shiftMonth(mes, -1)}`;
  const nextHref = `/admin/mayordomia?mes=${shiftMonth(mes, 1)}`;

  let transactions: Transaction[] = [];
  let prevTx: Transaction[] = [];
  let ytdTx: Transaction[] = [];
  if (useReal && realProfile) {
    try {
      const { listTransactions } = await import("@/lib/db");
      const slug = await getAdminTenantSlug();
      transactions = await listTransactions(slug, start, end);
      const prev = monthBounds(shiftMonth(mes, -1));
      prevTx = await listTransactions(slug, prev.start, prev.end);
      ytdTx = await listTransactions(slug, monthBounds(`${yearNum}-01`).start, monthBounds(`${yearNum}-12`).end);
    } catch {}
  }

  // Totales: ingresos confirmados vs egresos aprobados
  let ingresos = 0;
  let egresos = 0;
  const sumTx = (list: Transaction[]) =>
    list.reduce(
      (acc, t) => {
        const amt = Number(t.amount) || 0;
        if (t.kind === "ingreso" && t.status === "confirmado") acc.ingresos += amt;
        if (t.kind === "egreso" && t.approval_status === "aprobado") acc.egresos += amt;
        return acc;
      },
      { ingresos: 0, egresos: 0 },
    );

  const cur = sumTx(transactions);
  ingresos = cur.ingresos;
  egresos = cur.egresos;
  const prev = sumTx(prevTx);
  const ytd = sumTx(ytdTx);

  // Desglose por categoría del mes (ingresos confirmados / egresos aprobados)
  const catMap = new Map<string, { kind: "ingreso" | "egreso"; amount: number }>();
  for (const t of transactions) {
    const amt = Number(t.amount) || 0;
    const ok = t.kind === "ingreso" ? t.status === "confirmado" : t.approval_status === "aprobado";
    if (!ok) continue;
    const key = `${t.kind}:${t.category}`;
    const ex = catMap.get(key);
    catMap.set(key, { kind: t.kind, amount: (ex?.amount ?? 0) + amt });
  }
  const byCategory = [...catMap.entries()].map(([key, v]) => ({
    kind: v.kind,
    category: key.split(":")[1],
    amount: v.amount,
  }));

  const prevLabel = `${MONTHS[Number(shiftMonth(mes, -1).split("-")[1]) - 1]} ${shiftMonth(mes, -1).split("-")[0]}`;

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

      {useReal && (
        <StewardshipReports
          byCategory={byCategory}
          current={{ ingresos, egresos, balance: ingresos - egresos }}
          prev={{ ...prev, balance: prev.ingresos - prev.egresos }}
          ytd={{ ...ytd, balance: ytd.ingresos - ytd.egresos }}
          prevLabel={prevLabel}
        />
      )}
    </AdminShell>
  );
}