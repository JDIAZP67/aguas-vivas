"use client";

import { useState, type FormEvent } from "react";
import { PAYMENT_METHODS } from "@/lib/types";

interface Props {
  donationInfo: string | null;
  whatsapp: string | null;
}

export default function DonationForm({ donationInfo, whatsapp }: Props) {
  const [sending, setSending] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (sending) return;
    setSending(true);
    setError(null);

    const fd = new FormData(e.currentTarget);
    try {
      const res = await fetch("/api/transactions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          public: true,
          category: String(fd.get("category") ?? "ofrenda"),
          amount: Number(fd.get("amount")),
          method: String(fd.get("method") ?? "transferencia"),
          donor_name: String(fd.get("donor_name") ?? ""),
          donor_email: String(fd.get("donor_email") ?? ""),
          donor_phone: String(fd.get("donor_phone") ?? ""),
          description: String(fd.get("description") ?? ""),
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        setError(
          data.error === "servicio"
            ? "No pudimos registrar tu intención en este momento. Realiza tu transferencia y avísanos por WhatsApp — será registrada igualmente."
            : data.error ?? "Ocurrió un error. Intenta nuevamente.",
        );
        return;
      }
      setDone(true);
    } catch {
      setError("Sin conexión con el servidor. Intenta nuevamente.");
    } finally {
      setSending(false);
    }
  }

  if (done) {
    return (
      <div className="success-panel">
        <div style={{ fontSize: "2.6rem", marginBottom: 10 }}>💛</div>
        <h3>¡Gracias por tu generosidad!</h3>
        <p>
          Hemos registrado tu intención de ofrenda. Nuestro equipo de
          Tesorería la confirmará al verificar el depósito y se generará tu{" "}
          <strong>comprobante</strong>.
        </p>
        {whatsapp && (
          <p style={{ marginTop: 14 }}>
            ¿Ya realizaste la transferencia? Envía tu captura por WhatsApp para
            agilizar la confirmación:
            <br />
            <strong>{whatsapp}</strong>
          </p>
        )}
      </div>
    );
  }

  return (
    <>
      {donationInfo && (
        <div className="card" style={{ maxWidth: 640, margin: "0 auto 26px", background: "#fffaf0" }}>
          <h3>Cuentas de la iglesia</h3>
          <p
            style={{
              whiteSpace: "pre-line",
              fontSize: "0.92rem",
              lineHeight: 1.7,
              color: "var(--ink)",
              marginBottom: 0,
            }}
          >
            {donationInfo}
          </p>
        </div>
      )}

      <form className="form-shell" onSubmit={handleSubmit}>
        <div className="field-grid">
          <div className="field">
            <label htmlFor="category">Tipo de contribución</label>
            <select id="category" name="category" defaultValue="diezmo">
              <option value="diezmo">Diezmo</option>
              <option value="ofrenda">Ofrenda general</option>
              <option value="donacion">Donación especial</option>
            </select>
          </div>
          <div className="field">
            <label htmlFor="amount">
              Monto en soles <span className="req">*</span>
            </label>
            <input
              id="amount"
              name="amount"
              type="number"
              step="0.01"
              min="1"
              required
              placeholder="Ej. 50.00"
            />
          </div>
          <div className="field full">
            <label htmlFor="donor_name">
              Tu nombre <span className="req">*</span>
            </label>
            <input id="donor_name" name="donor_name" required maxLength={120} />
          </div>
          <div className="field">
            <label htmlFor="method">Medio que usarás</label>
            <select id="method" name="method" defaultValue="transferencia">
              {PAYMENT_METHODS.map((m) => (
                <option key={m.value} value={m.value}>
                  {m.label}
                </option>
              ))}
            </select>
          </div>
          <div className="field">
            <label htmlFor="donor_phone">Teléfono / WhatsApp</label>
            <input id="donor_phone" name="donor_phone" type="tel" maxLength={40} />
          </div>
          <div className="field full">
            <label htmlFor="donor_email">Correo electrónico</label>
            <input id="donor_email" name="donor_email" type="email" maxLength={160} />
          </div>
          <div className="field full">
            <label htmlFor="description">Mensaje (opcional)</label>
            <textarea
              id="description"
              name="description"
              placeholder="¿Es para un propósito especial? Cuéntanoslo…"
              maxLength={500}
            />
          </div>
        </div>

        {error && (
          <div className={`form-status ${error.includes("servicio") ? "ok" : "err"}`} role="alert">
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={sending}
          className="btn btn-primary"
          style={{ width: "100%", marginTop: 22, padding: "14px 20px", fontSize: "0.95rem" }}
        >
          {sending ? "Registrando…" : "Registrar mi diezmo u ofrenda"}
        </button>

        <p style={{ fontSize: "0.78rem", color: "var(--ink-soft)", marginTop: 16 }}>
          Al registrar, recibirás tu comprobante una vez confirmado el
          depósito. Tus datos solo se usan para el registro contable de la
          iglesia.
        </p>
      </form>
    </>
  );
}
