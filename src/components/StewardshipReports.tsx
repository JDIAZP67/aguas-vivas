import type { Transaction, TxKind } from "@/lib/types";
import { categoryLabel } from "@/lib/types";

const money = (n: number) =>
  `S/ ${n.toLocaleString("es-PE", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

function pct(current: number, prev: number): string {
  if (prev <= 0) return current > 0 ? "—" : "0%";
  const d = ((current - prev) / prev) * 100;
  return `${d >= 0 ? "+" : ""}${d.toFixed(0)}%`;
}

export default function StewardshipReports({
  byCategory,
  current,
  prev,
  ytd,
  prevLabel,
}: {
  byCategory: { kind: TxKind; category: string; amount: number }[];
  current: { ingresos: number; egresos: number; balance: number };
  prev: { ingresos: number; egresos: number; balance: number };
  ytd: { ingresos: number; egresos: number; balance: number };
  prevLabel: string;
}) {
  const ingresoMax = Math.max(1, ...byCategory.filter((c) => c.kind === "ingreso").map((c) => c.amount));
  const egresoMax = Math.max(1, ...byCategory.filter((c) => c.kind === "egreso").map((c) => c.amount));

  const up = (v: number, base: number) => v >= base;
  const delta = (a: number, b: number) => (a >= b ? "#1d7a53" : "#b03a2e");

  return (
    <div className="admin-stack" style={{ marginTop: 28 }}>
      <h2 style={{ fontSize: "1.05rem", margin: "0 0 14px" }}>Reportes y comparativas</h2>

      <div className="card" style={{ padding: "18px 20px" }}>
        <h3 style={{ margin: "0 0 4px" }}>Comparativa con {prevLabel}</h3>
        <p style={{ margin: "0 0 16px", fontSize: "0.8rem", color: "var(--ink-soft)" }}>
          Mes en curso vs. mes anterior · acumulado del año entre paréntesis
        </p>
        <div style={{ display: "grid", gap: 20, gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))" }}>
          <div>
            <div className="label" style={{ fontSize: "0.74rem", color: "var(--ink-soft)" }}>Ingresos confirmados</div>
            <div style={{ fontSize: "1.15rem", fontWeight: 700, color: "#1d7a53" }}>{money(current.ingresos)}</div>
            <div style={{ fontSize: "0.78rem", color: "var(--ink-soft)" }}>
              vs {money(prev.ingresos)} ·{" "}
              <b style={{ color: delta(current.ingresos, prev.ingresos) }}>{pct(current.ingresos, prev.ingresos)}</b>
            </div>
            <div style={{ fontSize: "0.78rem", color: "var(--ink-soft)" }}>
              Año: <b>{money(ytd.ingresos)}</b>
            </div>
          </div>
          <div>
            <div className="label" style={{ fontSize: "0.74rem", color: "var(--ink-soft)" }}>Egresos aprobados</div>
            <div style={{ fontSize: "1.15rem", fontWeight: 700, color: "#b03a2e" }}>{money(current.egresos)}</div>
            <div style={{ fontSize: "0.78rem", color: "var(--ink-soft)" }}>
              vs {money(prev.egresos)} ·{" "}
              <b style={{ color: delta(current.egresos, prev.egresos) }}>{pct(current.egresos, prev.egresos)}</b>
            </div>
            <div style={{ fontSize: "0.78rem", color: "var(--ink-soft)" }}>
              Año: <b>{money(ytd.egresos)}</b>
            </div>
          </div>
          <div>
            <div className="label" style={{ fontSize: "0.74rem", color: "var(--ink-soft)" }}>Balance del mes</div>
            <div style={{ fontSize: "1.15rem", fontWeight: 700, color: current.balance >= 0 ? "#1d7a53" : "#b03a2e" }}>
              {money(current.balance)}
            </div>
            <div style={{ fontSize: "0.78rem", color: "var(--ink-soft)" }}>
              Balance del año: <b style={{ color: ytd.balance >= 0 ? "#1d7a53" : "#b03a2e" }}>{money(ytd.balance)}</b>
            </div>
          </div>
        </div>
      </div>

      <div className="stew-grid">
        <div className="card" style={{ padding: "18px 20px" }}>
          <h3 style={{ margin: "0 0 12px" }}>Ingresos por categoría (mes)</h3>
          {byCategory.some((c) => c.kind === "ingreso") ? (
            byCategory
              .filter((c) => c.kind === "ingreso")
              .map((c) => (
                <div key={c.category} style={{ marginBottom: 10 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.84rem" }}>
                    <span>{categoryLabel(c.category, "ingreso")}</span>
                    <b>{money(c.amount)}</b>
                  </div>
                  <div className="level-progress-track">
                    <div
                      className="level-progress-fill"
                      style={{ width: `${Math.round((c.amount / ingresoMax) * 100)}%`, background: "#1d7a53" }}
                    />
                  </div>
                </div>
              ))
          ) : (
            <p style={{ fontSize: "0.84rem", color: "var(--ink-soft)", margin: 0 }}>Sin ingresos confirmados este mes.</p>
          )}
        </div>

        <div className="card" style={{ padding: "18px 20px" }}>
          <h3 style={{ margin: "0 0 12px" }}>Egresos por categoría (mes)</h3>
          {byCategory.some((c) => c.kind === "egreso") ? (
            byCategory
              .filter((c) => c.kind === "egreso")
              .map((c) => (
                <div key={c.category} style={{ marginBottom: 10 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.84rem" }}>
                    <span>{categoryLabel(c.category, "egreso")}</span>
                    <b>{money(c.amount)}</b>
                  </div>
                  <div className="level-progress-track">
                    <div
                      className="level-progress-fill"
                      style={{ width: `${Math.round((c.amount / egresoMax) * 100)}%`, background: "#b03a2e" }}
                    />
                  </div>
                </div>
              ))
          ) : (
            <p style={{ fontSize: "0.84rem", color: "var(--ink-soft)", margin: 0 }}>Sin egresos aprobados este mes.</p>
          )}
        </div>
      </div>
    </div>
  );
}