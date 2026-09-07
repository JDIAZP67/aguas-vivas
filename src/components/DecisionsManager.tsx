"use client";

import { useState } from "react";
import type { SalvationDecision } from "@/lib/types";

const STATUS_META: Record<
  SalvationDecision["status"],
  { label: string; color: string }
> = {
  nuevo: { label: "Nuevo", color: "#b3261e" },
  contactado: { label: "Contactado", color: "#b07d10" },
  discipulado: { label: "En discipulado", color: "#0a7d52" },
  integrado: { label: "Integrado", color: "var(--sky-deep)" },
};

const STATUS_FLOW: SalvationDecision["status"][] = [
  "nuevo",
  "contactado",
  "discipulado",
  "integrado",
];

export default function DecisionsManager({
  decisions,
  counts,
  editable,
  tenantId,
}: {
  decisions: SalvationDecision[];
  counts: Record<string, number>;
  editable: boolean;
  tenantId: string | null;
}) {
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState("");

  async function setStatus(d: SalvationDecision, status: SalvationDecision["status"]) {
    setError("");
    setBusyId(d.id);
    try {
      const res = await fetch("/api/admin/decisions", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: d.id,
          status,
          tenant_id: tenantId ?? undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) setError(data.error ?? "No se pudo actualizar.");
    } catch {
      setError("No se pudo actualizar.");
    } finally {
      setBusyId(null);
      window.location.reload();
    }
  }

  if (!decisions.length) {
    return (
      <div className="empty-state" style={{ padding: "48px 24px", textAlign: "center" }}>
        <div style={{ fontSize: "2rem", marginBottom: 8 }}>🌱</div>
        <b>Aún no hay decisiones registradas</b>
        <p style={{ margin: "6px 0 0" }}>
          Cuando alguien se decida por Jesús en el Plan de Salvación, aparecerá aquí
          para hacerle seguimiento.
        </p>
      </div>
    );
  }

  return (
    <div>
      {error && (
        <div className="perm-note" style={{ marginBottom: 16, color: "#b3261e" }}>
          {error}
        </div>
      )}

      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: 10,
          marginBottom: 22,
        }}
      >
        {STATUS_FLOW.map((s) => (
          <span
            key={s}
            style={{
              padding: "7px 14px",
              borderRadius: 10,
              background: "rgba(10,59,92,0.05)",
              fontFamily: "var(--font-mono)",
              fontSize: "0.76rem",
            }}
          >
            {STATUS_META[s].label}: <b>{counts[s] ?? 0}</b>
          </span>
        ))}
        <span
          style={{
            padding: "7px 14px",
            borderRadius: 10,
            background: "var(--sky-deep)",
            color: "#fff",
            fontFamily: "var(--font-mono)",
            fontSize: "0.76rem",
          }}
        >
          Total: {decisions.length}
        </span>
      </div>

      <div className="deci-list" style={{ display: "grid", gap: 14 }}>
        {decisions.map((d) => {
          const meta = STATUS_META[d.status];
          return (
            <article
              key={d.id}
              style={{
                background: "#fff",
                border: "1px solid rgba(10,59,92,0.12)",
                borderRadius: 14,
                padding: "16px 18px",
                display: "flex",
                flexWrap: "wrap",
                gap: 14,
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              <div style={{ minWidth: 220, flex: 1 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <b style={{ fontSize: "0.98rem" }}>{d.full_name}</b>
                  <span
                    style={{
                      padding: "3px 10px",
                      borderRadius: 999,
                      fontSize: "0.7rem",
                      fontFamily: "var(--font-mono)",
                      background: meta.color,
                      color: "#fff",
                    }}
                  >
                    {meta.label}
                  </span>
                </div>
                <p style={{ margin: "6px 0 0", fontSize: "0.82rem", color: "#47606e" }}>
                  {[d.email, d.phone].filter(Boolean).join(" · ") || "Sin contacto"}
                  {d.country || d.city ? ` · ${[d.city, d.country].filter(Boolean).join(", ")}` : ""}
                </p>
                {d.message ? (
                  <p style={{ margin: "8px 0 0", fontSize: "0.84rem", fontStyle: "italic" }}>
                    “{d.message}”
                  </p>
                ) : null}
                <p style={{ margin: "6px 0 0", fontSize: "0.72rem", fontFamily: "var(--font-mono)", color: "#8aa0ac" }}>
                  {new Date(d.created_at).toLocaleDateString("es-PE", {
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </p>
              </div>

              {editable && (
                <div
                  style={{
                    display: "flex",
                    gap: 6,
                    flexWrap: "wrap",
                    justifyContent: "flex-end",
                  }}
                >
                  {STATUS_FLOW.map((s) => (
                    <button
                      key={s}
                      className="btn"
                      disabled={busyId === d.id}
                      onClick={() => setStatus(d, s)}
                      style={{
                        padding: "7px 12px",
                        fontSize: "0.74rem",
                        background: d.status === s ? "var(--sky-deep)" : "transparent",
                        color: d.status === s ? "#fff" : "var(--sky-deep)",
                        border: "1px solid rgba(10,59,92,0.25)",
                      }}
                    >
                      {STATUS_META[s].label}
                    </button>
                  ))}
                </div>
              )}
            </article>
          );
        })}
      </div>
    </div>
  );
}