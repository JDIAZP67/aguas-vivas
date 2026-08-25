"use client";

import { useState, type FormEvent } from "react";

interface Status {
  type: "ok" | "err";
  msg: string;
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

export default function SalvationForm() {
  const [sending, setSending] = useState(false);
  const [status, setStatus] = useState<Status | null>(null);
  const [done, setDone] = useState(false);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (sending) return;
    setSending(true);
    setStatus(null);

    const fd = new FormData(e.currentTarget);
    const payload = {
      fullName: String(fd.get("fullName") ?? "").trim(),
      email: String(fd.get("email") ?? "").trim(),
      phone: String(fd.get("phone") ?? "").trim(),
      country: String(fd.get("country") ?? "").trim(),
      city: String(fd.get("city") ?? "").trim(),
      message: String(fd.get("message") ?? "").trim(),
      website: String(fd.get("website") ?? ""),
    };

    try {
      const res = await fetch("/api/decision", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();

      if (res.ok && data.ok) {
        setDone(true);
        window.scrollTo({ top: document.body.scrollHeight, behavior: "smooth" });
      } else {
        setStatus({
          type: "err",
          msg:
            data.error === "sin_conexion"
              ? "No pudimos registrar tu decisión en este momento. Escríbenos por WhatsApp al número de la iglesia — ¡tu decisión cuenta igual!"
              : data.error ?? "Ocurrió un error. Intenta nuevamente.",
        });
      }
    } catch {
      setStatus({
        type: "err",
        msg: "Sin conexión con el servidor. Verifica tu internet e intenta de nuevo.",
      });
    } finally {
      setSending(false);
    }
  }

  if (done) {
    return (
      <div className="success-panel">
        <div style={{ fontSize: "2.6rem", marginBottom: 10 }}>🕊️</div>
        <h3>¡Bienvenido a la familia de Dios!</h3>
        <p>
          Tu decisión fue registrada. Un líder de nuestra iglesia se pondrá en
          contacto contigo muy pronto.
        </p>
        <ul className="success-next">
          <li>Lee la Biblia empezando por el Evangelio de Juan.</li>
          <li>Ora a Dios cada día — Él quiere hablar contigo.</li>
          <li>Busca una iglesia cristiana para crecer acompañado.</li>
          <li>Cuéntale a alguien más sobre tu nueva vida en Cristo.</li>
        </ul>
        <p style={{ fontSize: "0.84rem", color: "var(--ink-soft)" }}>
          Mientras esperas el contacto de nuestro equipo, puedes crear tu
          cuenta y comenzar el Nivel 1 de formación bíblica.
        </p>
        <a
          href="/acceso"
          className="pbtn pbtn-solid"
          style={{ marginTop: 14 }}
        >
          Crear mi cuenta →
        </a>
      </div>
    );
  }

  return (
    <form className="form-shell" onSubmit={handleSubmit}>
      <div className="field-grid">
        <div className="field full">
          <label htmlFor="fullName">
            Nombre completo <span className="req">*</span>
          </label>
          <input id="fullName" name="fullName" required maxLength={120} />
        </div>
        <div className="field">
          <label htmlFor="email">Correo electrónico</label>
          <input id="email" name="email" type="email" maxLength={160} />
        </div>
        <div className="field">
          <label htmlFor="phone">Teléfono / WhatsApp</label>
          <input
            id="phone"
            name="phone"
            type="tel"
            placeholder="+51 ..."
            maxLength={40}
          />
        </div>
        <div className="field">
          <label htmlFor="country">País</label>
          <input id="country" name="country" maxLength={80} />
        </div>
        <div className="field">
          <label htmlFor="city">Ciudad</label>
          <input id="city" name="city" maxLength={80} />
        </div>
        <div className="field full">
          <label htmlFor="message">
            ¿Te gustaría contarnos algo? (opcional)
          </label>
          <textarea
            id="message"
            name="message"
            placeholder="Tu historia, dudas sobre la fe, o cómo llegaste hasta aquí…"
            maxLength={2000}
          />
        </div>
        <input
          className="hp-field"
          tabIndex={-1}
          autoComplete="off"
          name="website"
          aria-hidden="true"
        />
      </div>

      <p style={{ fontSize: "0.78rem", color: "var(--ink-soft)", marginTop: 18 }}>
        Al menos un medio de contacto (correo o teléfono) es necesario para que
        podamos escribirte. Tus datos se usan únicamente para el seguimiento
        pastoral.
      </p>

      {status && (
        <div className={`form-status ${status.type}`} role="alert">
          {status.msg}
        </div>
      )}

      <button
        type="submit"
        disabled={sending}
        className="btn btn-primary"
        style={{ width: "100%", marginTop: 22, padding: "14px 20px", fontSize: "0.95rem" }}
      >
        {sending ? "Enviando…" : "Quiero seguir a Jesús — enviar mi decisión"}
      </button>
    </form>
  );
}
