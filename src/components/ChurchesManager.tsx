"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import type { Tenant } from "@/lib/types";
import LogoPicker from "@/components/LogoPicker";

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

interface Props {
  tenants: Tenant[];
  activeSlug: string;
}

type FormState =
  | { mode: "create" }
  | { mode: "edit"; tenant: Tenant }
  | null;

const PLAN_LABELS: Record<string, string> = { free: "Free", premium: "Premium" };
const STATUS_LABELS: Record<string, string> = {
  pending: "Pendiente",
  active: "Activa",
  suspended: "Suspendida",
};

export default function ChurchesManager({ tenants, activeSlug }: Props) {
  const router = useRouter();
  const [form, setForm] = useState<FormState>(null);
  const [logoUrl, setLogoUrl] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  function openCreate() {
    setForm({ mode: "create" });
    setLogoUrl("");
    setError(null);
  }

  function openEdit(tenant: Tenant) {
    setForm({ mode: "edit", tenant });
    setLogoUrl(tenant.logo_url ?? "");
    setError(null);
  }

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (busy) return;
    setBusy(true);
    setError(null);
    setNotice(null);

    const fd = new FormData(e.currentTarget);
    const base = {
      name: String(fd.get("name") ?? "").trim(),
      country: String(fd.get("country") ?? "").trim(),
      city: String(fd.get("city") ?? "").trim(),
      primary_domain: String(fd.get("primary_domain") ?? "").trim(),
      brand_color: String(fd.get("brand_color") ?? "#0a3b5c"),
      plan: String(fd.get("plan") ?? "free"),
      status: String(fd.get("status") ?? "active"),
      logo_url: logoUrl,
    };

    const isEdit = form?.mode === "edit";
    const body = isEdit && form.mode === "edit"
      ? { ...base, slug: form.tenant.slug }
      : { ...base, slug: String(fd.get("slug") ?? "").trim(), clone_nivel1: fd.get("clone_nivel1") === "on" };

    try {
      const res = await fetch("/api/admin/iglesias", {
        method: isEdit ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        setError(data.error ?? "No se pudo guardar.");
        return;
      }
      setNotice(
        isEdit
          ? "Iglesia actualizada."
          : `Iglesia creada.${data.cloned ? ` Se clonó el Nivel 1 (${data.cloned} lecciones).` : ""}`,
      );
      setForm(null);
      router.refresh();
    } catch {
      setError("Sin conexión con el servidor.");
    } finally {
      setBusy(false);
    }
  }

  async function switchTenant(slug: string) {
    try {
      const res = await fetch("/api/tenant/switch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slug }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        setError(data.error ?? "No se pudo cambiar de iglesia.");
        return;
      }
      router.push("/admin");
      router.refresh();
    } catch {
      setError("Sin conexión con el servidor.");
    }
  }

  async function toggleStatus(tenant: Tenant) {
    const next = tenant.status === "suspended" ? "active" : "suspended";
    try {
      const res = await fetch("/api/admin/iglesias", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slug: tenant.slug, status: next }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        setError(data.error ?? "No se pudo cambiar el estado.");
        return;
      }
      router.refresh();
    } catch {
      setError("Sin conexión con el servidor.");
    }
  }

  const editing = form?.mode === "edit" ? form.tenant : null;

  return (
    <div>
      {form && (
        <form onSubmit={handleSubmit} style={{ marginBottom: 24 }}>
          <div className="card">
            <h3>
              {form.mode === "create" ? "Nueva iglesia" : `Editar: ${editing?.name}`}
            </h3>
            <p className="hint">
              Solo tú (Súper-Admin) gestionas dominio, plan y estado. La iglesia
              edita su marca, logo y datos de contacto desde su Configuración.
            </p>

            <div className="field-grid">
              <div className="field">
                <label htmlFor="name">
                  Nombre de la iglesia <span className="req">*</span>
                </label>
                <input
                  id="name"
                  name="name"
                  required
                  defaultValue={editing?.name ?? ""}
                  style={inputStyle}
                />
              </div>
              <div className="field">
                <label htmlFor="slug">Identificador (slug)</label>
                <input
                  id="slug"
                  name="slug"
                  disabled={form.mode === "edit"}
                  placeholder="mi-iglesia"
                  defaultValue={editing?.slug ?? ""}
                  style={{ ...inputStyle, opacity: form.mode === "edit" ? 0.6 : 1 }}
                />
              </div>
              <div className="field">
                <label htmlFor="country">País</label>
                <input id="country" name="country" defaultValue={editing?.country ?? ""} style={inputStyle} />
              </div>
              <div className="field">
                <label htmlFor="city">Ciudad</label>
                <input id="city" name="city" defaultValue={editing?.city ?? ""} style={inputStyle} />
              </div>
              <div className="field full">
                <label htmlFor="primary_domain">Dominio propio (ej: www.miiglesia.com)</label>
                <input
                  id="primary_domain"
                  name="primary_domain"
                  defaultValue={editing?.primary_domain ?? ""}
                  placeholder="www.mi-iglesia.org"
                  style={inputStyle}
                />
              </div>
              <div className="field">
                <label htmlFor="plan">Plan</label>
                <select id="plan" name="plan" defaultValue={editing?.plan ?? "free"} style={inputStyle}>
                  <option value="free">Free</option>
                  <option value="premium">Premium</option>
                </select>
              </div>
              <div className="field">
                <label htmlFor="status">Estado</label>
                <select id="status" name="status" defaultValue={editing?.status ?? "active"} style={inputStyle}>
                  <option value="pending">Pendiente</option>
                  <option value="active">Activa</option>
                  <option value="suspended">Suspendida</option>
                </select>
              </div>
              <div className="field">
                <label htmlFor="brand_color">Color de identidad</label>
                <select id="brand_color" name="brand_color" defaultValue={editing?.brand_color ?? "#0a3b5c"} style={inputStyle}>
                  {["#0a3b5c", "#1a5f8f", "#2f7d5c", "#8a3b3b", "#6b4a9e"].map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>
            </div>

            <div style={{ marginTop: 18 }}>
              <h4 style={{ marginBottom: 10 }}>Logo</h4>
              <LogoPicker value={logoUrl} onChange={setLogoUrl} onError={setError} />
            </div>

            {form.mode === "create" && (
              <label
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  marginTop: 18,
                  fontSize: "0.88rem",
                }}
              >
                <input type="checkbox" name="clone_nivel1" defaultChecked />
                Clonar el curso «Nivel 1» (con sus lecciones) desde la iglesia principal
              </label>
            )}

            <div className="save-bar">
              <button type="submit" disabled={busy} className="btn btn-primary">
                {busy ? "Guardando…" : form.mode === "create" ? "Crear iglesia" : "Guardar cambios"}
              </button>
              <button
                type="button"
                className="btn btn-ghost"
                disabled={busy}
                onClick={() => setForm(null)}
              >
                Cancelar
              </button>
              {error && (
                <span className="save-note" style={{ color: "var(--danger)" }}>
                  {error}
                </span>
              )}
            </div>
          </div>
        </form>
      )}

      {notice && (
        <div className="perm-note" style={{ marginBottom: 18 }}>
          <span>✅</span>
          <div>{notice}</div>
        </div>
      )}

      <div className="card" style={{ paddingTop: 8 }}>
        <div className="page-head" style={{ marginBottom: 6 }}>
          <div>
            <h3 style={{ marginBottom: 4 }}>Iglesias registradas</h3>
            <p className="hint">Elige «Gestionar» para trabajar sobre esa iglesia.</p>
          </div>
          <button type="button" className="pbtn pbtn-solid" onClick={openCreate}>
            + Nueva iglesia
          </button>
        </div>

        {!tenants.length && (
          <div className="perm-note">
            <span>🏛</span>
            <div>
              <b>Aún no hay iglesias</b>
              Crea la primera con el botón «Nueva iglesia».
            </div>
          </div>
        )}

        <table className="church-table" style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr>
              <th>Iglesia</th>
              <th>Dominio</th>
              <th>Ubicación</th>
              <th>Plan</th>
              <th>Estado</th>
              <th style={{ textAlign: "right" }}>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {tenants.map((t) => {
              const isActive = t.slug === activeSlug;
              return (
                <tr key={t.id} style={{ borderTop: "1px solid var(--line)" }}>
                  <td style={{ padding: "12px 8px 12px 0" }}>
                    <div style={{ fontWeight: 700 }}>{t.name}</div>
                    <div style={{ fontSize: "0.78rem", color: "var(--ink-soft)" }}>
                      /{t.slug}
                      {isActive ? " · trabajando ahora" : ""}
                    </div>
                  </td>
                  <td style={{ padding: 12 }}>{t.primary_domain ?? "—"}</td>
                  <td style={{ padding: 12 }}>
                    {[t.city, t.country].filter(Boolean).join(", ") || "—"}
                  </td>
                  <td style={{ padding: 12 }}>{PLAN_LABELS[t.plan]}</td>
                  <td style={{ padding: 12 }}>
                    <span
                      className="badge"
                      style={{
                        background:
                          t.status === "active"
                            ? "rgba(35,141,92,0.16)"
                            : t.status === "pending"
                              ? "rgba(212,161,49,0.16)"
                              : "rgba(187,52,52,0.16)",
                        color:
                          t.status === "active"
                            ? "var(--ok)"
                            : t.status === "pending"
                              ? "var(--gold)"
                              : "var(--danger)",
                      }}
                    >
                      {STATUS_LABELS[t.status]}
                    </span>
                  </td>
                  <td style={{ padding: 12, textAlign: "right", whiteSpace: "nowrap" }}>
                    {t.status === "active" && (
                      <button type="button" className="btn btn-primary" style={{ marginRight: 8 }} onClick={() => switchTenant(t.slug)}>
                        Gestionar
                      </button>
                    )}
                    <button type="button" className="btn" style={{ marginRight: 8 }} onClick={() => openEdit(t)}>
                      Editar
                    </button>
                    <button
                      type="button"
                      className="btn btn-ghost"
                      onClick={() => toggleStatus(t)}
                      title={t.status === "suspended" ? "Activar" : "Suspender"}
                    >
                      {t.status === "suspended" ? "Activar" : "Suspender"}
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}