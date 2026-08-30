"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import {
  SESSION_TYPE_LABELS,
  type Session,
  type SessionStatus,
} from "@/lib/types";

interface Props {
  initialSessions: Session[];
  canEdit: boolean;
  isDemo?: boolean;
}

interface FormState {
  id: string | null;
  title: string;
  type: string;
  host_name: string;
  starts_at: string;
  duration_min: string;
  video_url: string;
  notes: string;
}

const EMPTY: FormState = {
  id: null,
  title: "",
  type: "predicacion",
  host_name: "",
  starts_at: "",
  duration_min: "60",
  video_url: "",
  notes: "",
};

const inputStyle = {
  fontFamily: "var(--font-body)",
  fontSize: "0.88rem",
  padding: "10px 13px",
  border: "1px solid var(--line)",
  borderRadius: 10,
  background: "var(--foam)",
  color: "var(--ink)",
  width: "100%",
} as const;

function fmtDate(iso: string | null) {
  if (!iso) return "Sin fecha";
  return new Date(iso).toLocaleString("es-PE", {
    weekday: "short",
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function SessionsManager({ initialSessions, canEdit, isDemo = true }: Props) {
  const router = useRouter();
  const [sessions, setSessions] = useState<Session[]>(initialSessions);
  const [form, setForm] = useState<FormState>(EMPTY);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ type: "ok" | "err"; text: string } | null>(
    null,
  );

  async function call(
    method: "POST" | "PUT" | "DELETE",
    body: Record<string, unknown>,
    okText: string,
  ) {
    if (busy) return;
    setBusy(true);
    setMsg(null);
    try {
      if (isDemo) {
        if (method !== "DELETE") {
          const current: Session | undefined =
            method === "PUT"
              ? sessions.find((x) => x.id === String(body.id ?? ""))
              : undefined;

          if (method === "PUT" && !current) {
            setMsg({ type: "err", text: "Sesión no encontrada." });
            return null;
          }

          if (method === "POST") {
            const s: Session = {
              id: `demo-${Date.now()}`,
              tenant_id: "demo-tenant-aguas-vivas",
              title: String(body.title ?? "").trim() || "Sesión",
              type: (body.type as Session["type"]) ?? "predicacion",
              course_id: null,
              host_name: String(body.host_name ?? "").trim() || null,
              starts_at: body.starts_at
                ? new Date(String(body.starts_at)).toISOString()
                : null,
              duration_min: Number(body.duration_min) || 60,
              video_url: String(body.video_url ?? "").trim() || null,
              notes: String(body.notes ?? "").trim() || null,
              status: "programada",
            };
            setMsg({ type: "ok", text: okText });
            return s;
          }

          const updated = { ...current, ...(body as Partial<Session>) } as Session;
          setMsg({ type: "ok", text: okText });
          return updated;
        }

        setMsg({ type: "ok", text: okText });
        return { id: String(body.id ?? "") } as unknown as Session;
      }

      const res = await fetch("/api/sessions", {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        setMsg({ type: "err", text: data.error ?? "Error inesperado." });
        return null;
      }
      setMsg({ type: "ok", text: okText });
      router.refresh();
      return data.session as Session | undefined;
    } catch {
      setMsg({ type: "err", text: "Sin conexión con el servidor." });
      return null;
    } finally {
      setBusy(false);
    }
  }

  async function handleSave(e: FormEvent) {
    e.preventDefault();
    const payload = { ...form };
    const saved = await call(
      form.id ? "PUT" : "POST",
      payload,
      form.id ? "Sesión actualizada ✓" : "Sesión creada ✓",
    );
    if (saved) {
      setSessions((prev) =>
        form.id
          ? prev.map((s) => (s.id === saved.id ? saved : s))
          : [...prev, saved],
      );
      setForm(EMPTY);
    }
  }

  async function setStatus(s: Session, status: SessionStatus) {
    const updated = await call("PUT", { id: s.id, status }, `Estado cambiado ✓`);
    if (updated) {
      setSessions((prev) => prev.map((x) => (x.id === s.id ? updated : x)));
    }
  }

  async function remove(s: Session) {
    const ok = await call("DELETE", { id: s.id }, "Sesión eliminada ✓");
    if (ok !== null) setSessions((prev) => prev.filter((x) => x.id !== s.id));
  }

  function editForm(s: Session) {
    setForm({
      id: s.id,
      title: s.title,
      type: s.type,
      host_name: s.host_name ?? "",
      starts_at: s.starts_at
        ? new Date(s.starts_at).toISOString().slice(0, 16)
        : "",
      duration_min: String(s.duration_min ?? 60),
      video_url: s.video_url ?? "",
      notes: s.notes ?? "",
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  const live = sessions.filter((s) => s.status === "en_vivo");
  const scheduled = sessions
    .filter((s) => s.status === "programada")
    .sort((a, b) => (a.starts_at ?? "").localeCompare(b.starts_at ?? ""));
  const finished = sessions
    .filter((s) => s.status === "finalizada")
    .sort((a, b) => (b.starts_at ?? "").localeCompare(a.starts_at ?? ""));

  const groups: Array<[string, Session[]]> = [
    ["🔴 En vivo ahora", live],
    ["📅 Programadas", scheduled],
    ["📼 Historial", finished],
  ];

  return (
    <>
      <div className="card">
        <h3>{form.id ? "Editar sesión" : "Programar nueva sesión"}</h3>
        <p className="hint">
          Crea la transmisión o clase con fecha y enlace de YouTube. Cuando
          llegue el momento, presiona «Iniciar» para que aparezca EN VIVO en la
          página pública.
        </p>

        <form onSubmit={handleSave}>
          <div className="field-grid">
            <div className="field full">
              <label>
                Título <span style={{ color: "var(--danger)" }}>*</span>
              </label>
              <input
                required
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                placeholder="Predicación dominical — Título del mensaje"
                style={inputStyle}
              />
            </div>
            <div className="field">
              <label>Tipo</label>
              <select
                value={form.type}
                onChange={(e) => setForm({ ...form, type: e.target.value })}
                style={inputStyle}
              >
                {Object.entries(SESSION_TYPE_LABELS).map(([v, l]) => (
                  <option key={v} value={v}>
                    {l}
                  </option>
                ))}
              </select>
            </div>
            <div className="field">
              <label>Responsable</label>
              <input
                value={form.host_name}
                onChange={(e) =>
                  setForm({ ...form, host_name: e.target.value })
                }
                placeholder="Pastor / maestro"
                style={inputStyle}
              />
            </div>
            <div className="field">
              <label>Fecha y hora</label>
              <input
                type="datetime-local"
                value={form.starts_at}
                onChange={(e) =>
                  setForm({ ...form, starts_at: e.target.value })
                }
                style={inputStyle}
              />
            </div>
            <div className="field">
              <label>Duración (min)</label>
              <input
                type="number"
                min={5}
                value={form.duration_min}
                onChange={(e) =>
                  setForm({ ...form, duration_min: e.target.value })
                }
                style={inputStyle}
              />
            </div>
            <div className="field full">
              <label>Enlace de YouTube (transmisión o grabación)</label>
              <input
                value={form.video_url}
                onChange={(e) => setForm({ ...form, video_url: e.target.value })}
                placeholder="https://youtube.com/watch?v=… o https://youtube.com/live/…"
                style={inputStyle}
              />
            </div>
            <div className="field full">
              <label>Notas / descripción breve</label>
              <textarea
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
                style={{ ...inputStyle, minHeight: 60, resize: "vertical" }}
              />
            </div>
          </div>

          {msg && (
            <div className={`form-status ${msg.type}`} role="status">
              {msg.text}
            </div>
          )}

          <div style={{ display: "flex", gap: 10, marginTop: 20 }}>
            <button
              type="submit"
              disabled={busy || !canEdit}
              className="btn btn-primary"
            >
              {busy
                ? "Guardando…"
                : form.id
                  ? "Guardar cambios"
                  : "+ Programar sesión"}
            </button>
            {form.id && (
              <button
                type="button"
                className="btn"
                onClick={() => setForm(EMPTY)}
              >
                Cancelar edición
              </button>
            )}
          </div>
        </form>
      </div>

      {groups.map(([label, items]) =>
        items.length ? (
          <div key={label} className="card">
            <h3>{label}</h3>
            <p className="hint">{items.length} sesión(es)</p>
            <table className="simple-table">
              <thead>
                <tr>
                  <th>Sesión</th>
                  <th>Fecha</th>
                  <th>Video</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {items.map((s) => (
                  <tr key={s.id}>
                    <td>
                      <b>{s.title}</b>
                      <br />
                      <span
                        style={{
                          fontFamily: "var(--font-mono)",
                          fontSize: "0.68rem",
                          color: "var(--sky-mid)",
                        }}
                      >
                        {SESSION_TYPE_LABELS[s.type]}
                        {s.host_name ? ` · ${s.host_name}` : ""}
                      </span>
                    </td>
                    <td style={{ whiteSpace: "nowrap" }}>{fmtDate(s.starts_at)}</td>
                    <td>{s.video_url ? "✓ listo" : "—"}</td>
                    <td style={{ whiteSpace: "nowrap" }}>
                      <div style={{ display: "flex", gap: 6 }}>
                        {s.status === "programada" && (
                          <button
                            disabled={!canEdit || busy}
                            onClick={() => setStatus(s, "en_vivo")}
                            className="btn"
                            style={{
                              padding: "6px 12px",
                              fontSize: "0.75rem",
                              background: "#c94a3c",
                              color: "white",
                              borderColor: "#c94a3c",
                            }}
                          >
                            Iniciar 🔴
                          </button>
                        )}
                        {s.status === "en_vivo" && (
                          <button
                            disabled={!canEdit || busy}
                            onClick={() => setStatus(s, "finalizada")}
                            className="btn"
                            style={{ padding: "6px 12px", fontSize: "0.75rem" }}
                          >
                            Finalizar
                          </button>
                        )}
                        <button
                          disabled={!canEdit}
                          onClick={() => editForm(s)}
                          className="btn"
                          style={{ padding: "6px 12px", fontSize: "0.75rem" }}
                        >
                          Editar
                        </button>
                        {s.status === "finalizada" && (
                          <button
                            disabled={!canEdit || busy}
                            onClick={() => remove(s)}
                            className="btn"
                            style={{
                              padding: "6px 12px",
                              fontSize: "0.75rem",
                              color: "var(--danger)",
                            }}
                          >
                            ✕
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : null,
      )}
    </>
  );
}
