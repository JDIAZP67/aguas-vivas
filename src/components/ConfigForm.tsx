"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import type { Tenant } from "@/lib/types";

interface Props {
  tenant: Tenant;
}

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

export default function ConfigForm({ tenant }: Props) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSave(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (busy) return;
    setBusy(true);
    setSaved(false);
    setError(null);

    const fd = new FormData(e.currentTarget);
    const payload = {
      name: String(fd.get("name") ?? "").trim(),
      country: String(fd.get("country") ?? "").trim(),
      city: String(fd.get("city") ?? "").trim(),
      address: String(fd.get("address") ?? "").trim(),
      description: String(fd.get("description") ?? "").trim(),
      brand_color: String(fd.get("brand_color") ?? "#0a3b5c"),
      contact_email: String(fd.get("contact_email") ?? "").trim(),
      contact_phone: String(fd.get("contact_phone") ?? "").trim(),
      whatsapp: String(fd.get("whatsapp") ?? "").trim(),
      facebook: String(fd.get("facebook") ?? "").trim(),
      instagram: String(fd.get("instagram") ?? "").trim(),
      youtube: String(fd.get("youtube") ?? "").trim(),
      service_schedule: String(fd.get("service_schedule") ?? "").trim(),
    };

    try {
      const res = await fetch("/api/tenant", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        setError(data.error ?? "No se pudieron guardar los cambios.");
        return;
      }
      setSaved(true);
      router.refresh();
      setTimeout(() => setSaved(false), 4000);
    } catch {
      setError("Sin conexión con el servidor. Intenta nuevamente.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={handleSave}>
      <div className="card">
        <h3>Información de la iglesia</h3>
        <p className="hint">
          Datos básicos que identifican a la congregación dentro de la
          plataforma y en su página pública.
        </p>
        <div className="field-grid">
          <div className="field full">
            <label htmlFor="name">
              Nombre de la iglesia <span className="req">*</span>
            </label>
            <input
              id="name"
              name="name"
              required
              defaultValue={tenant.name}
              style={inputStyle}
            />
          </div>
          <div className="field">
            <label htmlFor="country">País</label>
            <input id="country" name="country" defaultValue={tenant.country ?? ""} style={inputStyle} />
          </div>
          <div className="field">
            <label htmlFor="city">Ciudad</label>
            <input id="city" name="city" defaultValue={tenant.city ?? ""} style={inputStyle} />
          </div>
          <div className="field full">
            <label htmlFor="address">Dirección física</label>
            <input id="address" name="address" defaultValue={tenant.address ?? ""} style={inputStyle} />
          </div>
          <div className="field full">
            <label htmlFor="description">Descripción breve</label>
            <textarea
              id="description"
              name="description"
              defaultValue={tenant.description ?? ""}
              style={{ ...inputStyle, minHeight: 70, resize: "vertical" }}
            />
          </div>
        </div>
      </div>

      <div className="card">
        <h3>Color de identidad</h3>
        <p className="hint">
          Se aplicará a botones, enlaces y acentos de la página pública.
        </p>
        <div className="color-row">
          {["#0a3b5c", "#1a5f8f", "#2f7d5c", "#8a3b3b", "#6b4a9e"].map((c) => (
            <label key={c} title={c}>
              <input
                type="radio"
                name="brand_color"
                value={c}
                defaultChecked={(tenant.brand_color ?? "#0a3b5c") === c}
                style={{ display: "none" }}
              />
              <span className="swatch" style={{ background: c, display: "block" }} />
            </label>
          ))}
        </div>
      </div>

      <div className="card">
        <h3>Contacto general</h3>
        <p className="hint">
          Visible en el pie de página y sección de contacto del sitio público.
        </p>
        <div className="field-grid">
          <div className="field">
            <label htmlFor="contact_phone">Teléfono</label>
            <input id="contact_phone" name="contact_phone" defaultValue={tenant.contact_phone ?? ""} style={inputStyle} />
          </div>
          <div className="field">
            <label htmlFor="whatsapp">WhatsApp</label>
            <input id="whatsapp" name="whatsapp" defaultValue={tenant.whatsapp ?? ""} style={inputStyle} />
          </div>
          <div className="field full">
            <label htmlFor="contact_email">Correo de contacto</label>
            <input id="contact_email" name="contact_email" type="email" defaultValue={tenant.contact_email ?? ""} style={inputStyle} />
          </div>
          <div className="field">
            <label htmlFor="facebook">Facebook</label>
            <input id="facebook" name="facebook" defaultValue={tenant.facebook ?? ""} placeholder="/iglesiaoficial" style={inputStyle} />
          </div>
          <div className="field">
            <label htmlFor="instagram">Instagram</label>
            <input id="instagram" name="instagram" defaultValue={tenant.instagram ?? ""} placeholder="@iglesia" style={inputStyle} />
          </div>
          <div className="field">
            <label htmlFor="youtube">YouTube</label>
            <input id="youtube" name="youtube" defaultValue={tenant.youtube ?? ""} placeholder="/iglesiatv" style={inputStyle} />
          </div>
          <div className="field">
            <label htmlFor="service_schedule">Horario de servicios</label>
            <input
              id="service_schedule"
              name="service_schedule"
              defaultValue={tenant.service_schedule ?? ""}
              placeholder="Dom 10:00 am · Mié 7:00 pm"
              style={inputStyle}
            />
          </div>
        </div>
      </div>

      <div className="save-bar">
        <button type="submit" disabled={busy} className="btn btn-primary">
          {busy ? "Guardando…" : "Guardar cambios"}
        </button>
        {saved && (
          <span className="save-note" style={{ color: "var(--ok)" }}>
            ✓ Cambios guardados
          </span>
        )}
        {error && (
          <span className="save-note" style={{ color: "var(--danger)" }}>
            {error}
          </span>
        )}
      </div>
    </form>
  );
}
