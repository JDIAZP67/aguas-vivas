import { redirect } from "next/navigation";
import AdminShell from "@/components/AdminShell";
import StewardshipManager from "@/components/StewardshipManager";
import { createClient } from "@/lib/supabase/server";
import type { Profile } from "@/lib/types";
import type { Transaction } from "@/lib/types";

export const metadata = {
  title: "Mayordomía — Panel Aguas Vivas",
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
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/acceso");

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .maybeSingle();

  const sessionUser = profile as Profile | null;

  // Solo roles financieros; Mantenimiento y otros quedan fuera
  if (!["super_admin", "pastor", "tesoreria"].includes(sessionUser?.role ?? "")) {
    return (
      <AdminShell active="/admin/mayordomia" profile={sessionUser}>
        <div className="card" style={{ maxWidth: 560 }}>
          <h3>Acceso restringido</h3>
          <p>
            El módulo de mayordomía está reservado a la Tesorería y el
            Pastorado de la iglesia. Si crees que deberías tener acceso,
            habla con tu pastor.
          </p>
        </div>
      </AdminShell>
    );
  }

  const params = await searchParams;
  const now = new Date();
  const currentMes = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  const mes = /^\d{4}-\d{2}$/.test(params.mes ?? "") ? params.mes! : currentMes;
  const { start, end } = monthBounds(mes);

  let transactions: Transaction[] = [];
  try {
    const { data: tenant } = await supabase
      .from("tenants")
      .select("id")
      .eq("slug", "aguas-vivas")
      .maybeSingle();

    if (tenant) {
      const { data } = await supabase
        .from("transactions")
        .select("*")
        .eq("tenant_id", tenant.id)
        .gte("occurred_at", start)
        .lt("occurred_at", end)
        .order("occurred_at", { ascending: false })
        .limit(300);
      transactions = (data as Transaction[]) ?? [];
    }
  } catch {}

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
    <AdminShell active="/admin/mayordomia" profile={sessionUser}>
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

      <StewardshipManager
        monthLabel={monthLabel}
        prevHref={prevHref}
        nextHref={nextHref}
        transactions={transactions}
        totals={{ ingresos, egresos, balance: ingresos - egresos }}
        canApprove={["super_admin", "pastor"].includes(sessionUser!.role)}
      />
    </AdminShell>
  );
}
