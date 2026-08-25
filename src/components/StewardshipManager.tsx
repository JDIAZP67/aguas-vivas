"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import type { Transaction, TxKind } from "@/lib/types";
import {
  INCOME_CATEGORIES,
  EXPENSE_CATEGORIES,
  PAYMENT_METHODS,
  categoryLabel,
  methodLabel,
} from "@/lib/types";

interface Props {
  monthLabel: string;
  prevHref: string;
  nextHref: string;
  transactions: Transaction[];
  totals: { ingresos: number; egresos: number; balance: number };
  canApprove: boolean;
}

const money = (n: number) =>
  `S/ ${n.toLocaleString("es-PE", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

function Pill({ tone, children }: { tone: "ok" | "warn" | "mut" | "danger"; children: React.ReactNode }) {
  return <span className={`pill pill-${tone}`}>{children}</span>;
}

function txPill(tx: Transaction) {
  if (tx.kind === "ingreso") {
    return tx.status === "pendiente"
      ? <Pill tone="warn">Por confirmar</Pill>
      : <Pill tone="ok">Confirmado</Pill>;
  }
  if (tx.approval_status === "pendiente_aprobacion") return <Pill tone="warn">Por aprobar</Pill>;
  if (tx.approval_status === "aprobado") return <Pill tone="ok">Aprobado</Pill>;
  return <Pill tone="danger">Rechazado</Pill>;
}

export default function StewardshipManager({
  monthLabel,
  prevHref,
  nextHref,
  transactions,
  totals,
  canApprove,
}: Props) {
  const router = useRouter();
  const [busyId, setBusyId] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);
  const [receipt, setReceipt] = useState<string | null>(null);
  const [incomeMsg, setIncomeMsg] = useState<string | null>(null);
  const [expenseMsg, setExpenseMsg] = useState<string | null>(null);

  async function act(id: string, action: "confirmar" | "aprobar" | "rechazar") {
    setBusyId(`${id}-${action}`);
    setMsg(null);
    try {
      const res = await fetch("/api/transactions", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, action }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        setMsg(data.error ?? "No se pudo completar la operación.");
        return;
      }
      if (action === "confirmar" && data.transaction?.receipt_code) {
        setReceipt(data.transaction.receipt_code);
      }
      router.refresh();
    } catch {
      setMsg("Sin conexión con el servidor.");
    } finally {
      setBusyId(null);
    }
  }

  async function submitTx(e: FormEvent<HTMLFormElement>, kind: TxKind) {
    e.preventDefault();
    const form = e.currentTarget;
    const fd = new FormData(form);
    const payload = {
      kind,
      category: String(fd.get("category") ?? ""),
      amount: Number(fd.get("amount")),
      description: String(fd.get("description") ?? ""),
      donor_name: String(fd.get("donor_name") ?? ""),
      method: String(fd.get("method") ?? "efectivo"),
    };
    if (!payload.amount || payload.amount <= 0) {
      kind === "ingreso" ? setIncomeMsg("Ingresa un monto válido.") : setExpenseMsg("Ingresa un monto válido.");
      return;
    }

    const setter = kind === "ingreso" ? setIncomeMsg : setExpenseMsg;
    setter("Guardando…");
    try {
      const res = await fetch("/api/transactions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        setter(data.error ?? "No se pudo registrar.");
        return;
      }
      setter(null);
      form.reset();
      router.refresh();
    } catch {
      setter("Sin conexión con el servidor.");
    }
  }

  function exportCsv() {
    const rows = [
      ["Fecha", "Tipo", "Categoría", "Detalle", "Medio", "Estado", "Monto", "Comprobante"],
      ...transactions.map((t) => [
        new Date(t.occurred_at).toLocaleDateString("es-PE"),
        t.kind,
        categoryLabel(t.category, t.kind),
        t.description ?? t.donor_name ?? "",
        methodLabel(t.method),
        t.status,
        String(t.amount),
        t.receipt_code ?? "",
      ]),
    ];
    const csv = rows.map((r) => r.map((c) => `"${c.replace(/"/g, '""')}"`).join(";")).join("\n");
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `reporte-mayordomia-${monthLabel.replace(/\s/g, "-").toLowerCase()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  const pendingCount =
    transactions.filter((t) => t.status === "pendiente" || t.approval_status === "pendiente_aprobacion").length;

  return (
    <div className="admin-stack">
      {/* Navegación de mes */}
      <div className="card" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 14 }}>
        <a href={prevHref} className="back-link">← Mes anterior</a>
        <h3 style={{ margin: 0 }}>{monthLabel}</h3>
        <a href={nextHref} className="back-link">Mes siguiente →</a>
      </div>

      {/* Resumen */}
      <div className="stew-grid">
        <div className="stew-card">
          <h4>Ingresos confirmados</h4>
          <strong>{money(totals.ingresos)}</strong>
        </div>
        <div className="stew-card">
          <h4>Egresos aprobados</h4>
          <strong style={{ color: "#b03a2e" }}>{money(totals.egresos)}</strong>
        </div>
        <div className="stew-card">
          <h4>Balance del mes</h4>
          <strong style={{ color: totals.balance >= 0 ? "#1d7a53" : "#b03a2e" }}>
            {money(totals.balance)}
          </strong>
        </div>
      </div>

      {receipt && (
        <div className="perm-note" style={{ borderColor: "var(--gold)" }}>
          <span>🧾</span>
          <div>
            <b>Comprobante emitido: {receipt}</b>
            Compártelo con el donante por WhatsApp o correo.
            <button className="btn btn-secondary btn-sm" onClick={() => setReceipt(null)} style={{ marginLeft: 12 }}>
              Cerrar
            </button>
          </div>
        </div>
      )}

      {msg && <div className="form-status err">{msg}</div>}

      {/* Formularios de registro */}
      <div className="field-grid">
        <form
          className="card"
          onSubmit={(e) => submitTx(e, "ingreso")}
          style={{ borderTop: "3px solid #1d7a53" }}
        >
          <h3>Registrar ingreso manual</h3>
          <p style={{ fontSize: "0.82rem" }}>
            Diezmos u ofrendas recibidos en efectivo o que ya verificaste en la cuenta bancaria.
          </p>
          <div className="field-grid">
            <div className="field">
              <label>Categoría</label>
              <select name="category" defaultValue="diezmo">
                {INCOME_CATEGORIES.map((c) => (
                  <option key={c.value} value={c.value}>{c.label}</option>
                ))}
              </select>
            </div>
            <div className="field">
              <label>Monto (S/) *</label>
              <input name="amount" type="number" step="0.01" min="1" required />
            </div>
            <div className="field full">
              <label>Donante (opcional)</label>
              <input name="donor_name" maxLength={120} />
            </div>
            <div className="field">
              <label>Medio</label>
              <select name="method" defaultValue="efectivo">
                {PAYMENT_METHODS.map((m) => (
                  <option key={m.value} value={m.value}>{m.label}</option>
                ))}
              </select>
            </div>
            <div className="field">
              <label>Nota</label>
              <input name="description" maxLength={500} />
            </div>
          </div>
          {incomeMsg && <div className="form-status err" style={{ marginTop: 10 }}>{incomeMsg}</div>}
          <button type="submit" className="btn btn-primary" style={{ marginTop: 16 }}>
            Registrar ingreso (+ comprobante)
          </button>
        </form>

        <form
          className="card"
          onSubmit={(e) => submitTx(e, "egreso")}
          style={{ borderTop: "3px solid var(--gold)" }}
        >
          <h3>Solicitar egreso</h3>
          <p style={{ fontSize: "0.82rem" }}>
            Quedará <b>pendiente de aprobación pastoral</b> antes de ejecutarse.
          </p>
          <div className="field-grid">
            <div className="field full">
              <label>Categoría</label>
              <select name="category" defaultValue="servicios">
                {EXPENSE_CATEGORIES.map((c) => (
                  <option key={c.value} value={c.value}>{c.label}</option>
                ))}
              </select>
            </div>
            <div className="field">
              <label>Monto (S/) *</label>
              <input name="amount" type="number" step="0.01" min="1" required />
            </div>
            <div className="field">
              <label>Solicitado por</label>
              <input name="requested_by_name" placeholder="Tu nombre" maxLength={120} />
            </div>
            <div className="field full">
              <label>Descripción *</label>
              <input name="description" required maxLength={500} placeholder="Ej. Pago mensual de streaming" />
            </div>
          </div>
          {expenseMsg && <div className="form-status err" style={{ marginTop: 10 }}>{expenseMsg}</div>}
          <button type="submit" className="btn btn-primary" style={{ marginTop: 16 }}>
            Enviar a aprobación pastoral
          </button>
        </form>
      </div>

      {/* Tabla del mes */}
      <div className="card">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
          <h3 style={{ margin: 0 }}>Movimientos de {monthLabel}</h3>
          <button className="btn btn-secondary btn-sm" onClick={exportCsv}>
            ⬇ Exportar CSV
          </button>
        </div>

        {!transactions.length ? (
          <p style={{ color: "var(--ink-soft)", marginBottom: 0 }}>
            No hay movimientos registrados en este mes.
          </p>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table className="simple-table">
              <thead>
                <tr>
                  <th>Fecha</th>
                  <th>Concepto</th>
                  <th>Medio</th>
                  <th>Estado</th>
                  <th style={{ textAlign: "right" }}>Monto</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {transactions.map((t) => (
                  <tr key={t.id}>
                    <td>{new Date(t.occurred_at).toLocaleDateString("es-PE")}</td>
                    <td>
                      <b>{categoryLabel(t.category, t.kind)}</b>
                      {(t.description || t.donor_name) && (
                        <span style={{ display: "block", fontSize: "0.78rem", color: "var(--ink-soft)" }}>
                          {t.donor_name ?? t.description}
                        </span>
                      )}
                      {t.receipt_code && (
                        <span className="pill pill-mut" style={{ marginTop: 4 }}>🧾 {t.receipt_code}</span>
                      )}
                    </td>
                    <td>{t.kind === "ingreso" ? methodLabel(t.method) : "—"}</td>
                    <td>{txPill(t)}</td>
                    <td className={t.kind === "ingreso" ? "amount-in" : "amount-out"} style={{ textAlign: "right", whiteSpace: "nowrap" }}>
                      {t.kind === "ingreso" ? "+" : "−"}{money(Number(t.amount))}
                    </td>
                    <td style={{ whiteSpace: "nowrap" }}>
                      {t.status === "pendiente" && (
                        <button
                          className="btn btn-primary btn-sm"
                          disabled={busyId === `${t.id}-confirmar`}
                          onClick={() => act(t.id, "confirmar")}
                        >
                          {busyId === `${t.id}-confirmar` ? "…" : "Confirmar"}
                        </button>
                      )}
                      {t.approval_status === "pendiente_aprobacion" &&
                        (canApprove ? (
                          <span style={{ display: "inline-flex", gap: 6 }}>
                            <button
                              className="btn btn-primary btn-sm"
                              disabled={busyId === `${t.id}-aprobar`}
                              onClick={() => act(t.id, "aprobar")}
                            >
                              ✓ Aprobar
                            </button>
                            <button
                              className="btn btn-secondary btn-sm"
                              disabled={busyId === `${t.id}-rechazar`}
                              onClick={() => act(t.id, "rechazar")}
                            >
                              ✗ Rechazar
                            </button>
                          </span>
                        ) : (
                          <span style={{ fontSize: "0.74rem", color: "var(--ink-soft)" }}>
                            Esperando pastorado
                          </span>
                        ))}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {pendingCount > 0 && (
        <p style={{ fontSize: "0.8rem", color: "var(--ink-soft)" }}>
          💡 Hay {pendingCount} movimiento(s) esperando confirmación o aprobación — revísalos arriba en la tabla.
        </p>
      )}
    </div>
  );
}
