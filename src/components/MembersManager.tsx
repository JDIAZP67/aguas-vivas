"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { Member } from "@/lib/types";

const ROLE_OPTIONS = ["miembro", "maestro", "tesoreria", "pastor"] as const;

export default function MembersManager({
  members,
  lessonTotals,
  doneTotals,
  allowPreview,
}: {
  members: Member[];
  lessonTotals: Record<string, number>;
  doneTotals: Record<string, number>;
  allowPreview: boolean;
}) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function patch(member: Member, action: string, value: unknown) {
    setError(null);
    setNotice(null);
    setBusy(true);
    try {
      const res = await fetch("/api/admin/members", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: member.id, action, value }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        setError(data.error ?? "No se pudo actualizar.");
        return;
      }
      setNotice("Miembro actualizado.");
      router.refresh();
    } catch {
      setError("Sin conexión con el servidor.");
    } finally {
      setBusy(false);
    }
  }

  async function resetPassword(member: Member) {
    const valor = prompt(`Nueva clave para ${member.full_name} (mín. 6 caracteres):`);
    if (valor === null || valor === "") return;
    await patch(member, "password", valor);
  }

  return (
    <div>
      {error && (
        <div className="perm-note" style={{ marginBottom: 18, color: "var(--danger)" }}>
          <span>⚠️</span>
          <div>{error}</div>
        </div>
      )}
      {notice && (
        <div className="perm-note" style={{ marginBottom: 18 }}>
          <span>✅</span>
          <div>{notice}</div>
        </div>
      )}

      {!members.length ? (
        <div className="perm-note">
          <span>👥</span>
          <div>
            <b>Aún no hay miembros</b>
            Cuando alguien se registre en la página de acceso de esta iglesia,
            aparecerá aquí.
          </div>
        </div>
      ) : (
        <div className="card" style={{ overflowX: "auto" }}>
          <table className="church-table">
            <thead>
              <tr>
                <th>Miembro</th>
                <th>Rol</th>
                <th>Estado</th>
                <th>Nivel</th>
                <th>Progreso</th>
                <th style={{ textAlign: "right" }}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {members.map((m) => {
                const total = lessonTotals[m.id] ?? 0;
                const done = doneTotals[m.id] ?? 0;
                const pct = total > 0 ? Math.round((done / total) * 100) : 0;
                return (
                  <tr key={m.id}>
                    <td>
                      <b>{m.full_name}</b>
                      <br />
                      <span style={{ fontSize: "0.78rem", color: "var(--ink-soft)" }}>
                        {m.email}
                      </span>
                    </td>
                    <td>
                      <select
                        value={m.role}
                        disabled={busy}
                        onChange={(e) =>
                          patch(m, "role", e.target.value)
                        }
                        style={{ fontSize: "0.82rem", padding: "6px 8px" }}
                      >
                        {ROLE_OPTIONS.map((r) => (
                          <option key={r} value={r}>
                            {r.charAt(0).toUpperCase() + r.slice(1)}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td>
                      <button
                        type="button"
                        className="badge"
                        disabled={busy}
                        onClick={() =>
                          patch(m, "status", m.status === "active" ? "suspended" : "active")
                        }
                        style={{
                          background:
                            m.status === "active"
                              ? "rgba(28,138,92,0.12)"
                              : "rgba(179,38,30,0.12)",
                          color: m.status === "active" ? "var(--ok)" : "var(--danger)",
                          cursor: "pointer",
                          border: "none",
                        }}
                      >
                        {m.status === "active" ? "Activo" : "Suspendido"}
                      </button>
                    </td>
                    <td>Nivel {m.level}</td>
                    <td>
                      {done}/{total}
                      {pct > 0 && ` · ${pct}%`}
                    </td>
                    <td style={{ textAlign: "right", whiteSpace: "nowrap" }}>
                      <button
                        type="button"
                        className="btn btn-ghost"
                        disabled={busy}
                        onClick={() => resetPassword(m)}
                        style={{ padding: "6px 10px", fontSize: "0.78rem" }}
                      >
                        Restablecer clave
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {!allowPreview && (
        <p className="hint" style={{ marginTop: 14 }}>
          Solo el Súper-Admin puede gestionar los miembros de otras iglesias.
        </p>
      )}
    </div>
  );
}