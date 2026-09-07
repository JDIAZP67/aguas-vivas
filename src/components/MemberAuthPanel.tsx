"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";

type Tab = "ingresar" | "registrar";
type View = "panel" | "forgot" | "reset";

export default function MemberAuthPanel({
  slug,
  tenantName,
}: {
  slug: string;
  tenantName: string;
}) {
  const router = useRouter();
  const sp = useSearchParams();
  const iglesia = sp.get("iglesia") ?? slug;
  const resetToken = sp.get("reset") ?? "";

  const [tab, setTab] = useState<Tab>("ingresar");
  const [view, setView] = useState<View>(resetToken ? "reset" : "panel");
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [clave, setClave] = useState("");
  const [clave2, setClave2] = useState("");
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(ev: React.FormEvent) {
    ev.preventDefault();
    setError("");
    setInfo("");
    setBusy(true);

    try {
      if (view === "forgot") {
        const res = await fetch(`${"/api/member/forgot"}?iglesia=${encodeURIComponent(iglesia)}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email }),
        });
        const data = await res.json();
        if (res.ok) {
          setInfo(
            data.ok
              ? "Si ese correo está registrado, recibirás un enlace para restablecer tu clave (válido 30 min)."
              : data.error ?? "No se pudo enviar el enlace.",
          );
        } else {
          setError(data.error ?? "No se pudo enviar el enlace.");
        }
        return;
      }

      if (view === "reset") {
        const res = await fetch("/api/member/reset", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token: resetToken, clave }),
        });
        const data = await res.json();
        if (res.ok) {
          router.push("/estudios?iglesia=" + encodeURIComponent(iglesia));
          router.refresh();
        } else {
          setError(data.error ?? "No se pudo restablecer la clave.");
        }
        return;
      }

      const endpoint = tab === "registrar" ? "/api/member/register" : "/api/member/login";
      const res = await fetch(`${endpoint}?iglesia=${encodeURIComponent(iglesia)}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(
          tab === "registrar"
            ? { full_name: fullName, email, clave }
            : { email, clave },
        ),
      });
      const data = await res.json();
      if (res.ok) {
        router.push("/estudios?iglesia=" + encodeURIComponent(iglesia));
        router.refresh();
      } else {
        setError(data.error || "No se pudo completar el acceso.");
      }
    } catch {
      setError("No se pudo completar la solicitud.");
    } finally {
      setBusy(false);
    }
  }

  if (view === "reset") {
    return (
      <div className="auth-card">
        <h1>Restablecer clave</h1>
        <p className="auth-sub">Crea una nueva clave para tu cuenta de miembro.</p>
        <form onSubmit={submit}>
          <div className="field full" style={{ marginBottom: 8 }}>
            <label htmlFor="clave">Nueva clave</label>
            <input
              id="clave"
              type="password"
              value={clave}
              onChange={(e) => setClave(e.target.value)}
              required
              minLength={6}
              autoComplete="new-password"
            />
          </div>
          <div className="field full" style={{ marginBottom: 8 }}>
            <label htmlFor="clave2">Repetir clave</label>
            <input
              id="clave2"
              type="password"
              value={clave2}
              onChange={(e) => setClave2(e.target.value)}
              required
              minLength={6}
              autoComplete="new-password"
            />
          </div>
          {error && (
            <div className="form-status" style={{ marginTop: 10, color: "#b3261e" }}>
              {error}
            </div>
          )}
          <button
            type="submit"
            className="btn btn-primary"
            disabled={busy || (clave.length > 0 && clave !== clave2)}
            style={{ width: "100%", marginTop: 18, padding: "13px 20px" }}
          >
            {busy ? "Guardando…" : "Restablecer clave"}
          </button>
          {clave.length > 0 && clave !== clave2 && (
            <p className="hint" style={{ marginTop: 8, color: "#b3261e" }}>
              Las claves no coinciden.
            </p>
          )}
        </form>
      </div>
    );
  }

  if (view === "forgot") {
    return (
      <div className="auth-card">
        <h1>Recuperar clave</h1>
        <p className="auth-sub">Te enviaremos un enlace para restablecer tu clave.</p>
        <form onSubmit={submit}>
          <div className="field full" style={{ marginBottom: 8 }}>
            <label htmlFor="email">Correo electrónico</label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
            />
          </div>
          {info && (
            <div className="form-status" style={{ marginTop: 10 }}>
              {info}
            </div>
          )}
          {error && (
            <div className="form-status" style={{ marginTop: 10, color: "#b3261e" }}>
              {error}
            </div>
          )}
          <button
            type="submit"
            className="btn btn-primary"
            disabled={busy}
            style={{ width: "100%", marginTop: 18, padding: "13px 20px" }}
          >
            {busy ? "Enviando…" : "Enviar enlace"}
          </button>
        </form>
        <p className="auth-alt" style={{ marginTop: 18 }}>
          <button
            type="button"
            onClick={() => setView("panel")}
            style={{ background: "none", border: "none", color: "var(--sky-mid)", fontWeight: 700, cursor: "pointer", padding: 0 }}
          >
            ← Volver al acceso
          </button>
        </p>
      </div>
    );
  }

  const qs = iglesia ? `?iglesia=${encodeURIComponent(iglesia)}` : "";

  return (
    <div className="auth-card">
      <h1>Área de miembros</h1>
      <p className="auth-sub">
        {tenantName} · lleva tu progreso en los niveles de estudio
      </p>

      <div className="auth-tabs">
        <button
          type="button"
          className={tab === "ingresar" ? "active" : ""}
          onClick={() => setTab("ingresar")}
        >
          Ingresar
        </button>
        <button
          type="button"
          className={tab === "registrar" ? "active" : ""}
          onClick={() => setTab("registrar")}
        >
          Registrarme
        </button>
      </div>

      <form onSubmit={submit}>
        {tab === "registrar" && (
          <div className="field full" style={{ marginBottom: 8 }}>
            <label htmlFor="fullName">Nombre completo</label>
            <input
              id="fullName"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              required
              autoComplete="name"
            />
          </div>
        )}

        <div className="field full" style={{ marginBottom: 8 }}>
          <label htmlFor="email">Correo electrónico</label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoComplete="email"
          />
        </div>

        <div className="field full" style={{ marginBottom: 8 }}>
          <label htmlFor="clave">Clave</label>
          <input
            id="clave"
            type="password"
            value={clave}
            onChange={(e) => setClave(e.target.value)}
            required
            minLength={6}
            autoComplete={tab === "registrar" ? "new-password" : "current-password"}
          />
        </div>

        {error && (
          <div className="form-status" style={{ marginTop: 10, color: "#b3261e" }}>
            {error}
          </div>
        )}

        {tab === "ingresar" && (
          <p style={{ marginTop: 10, textAlign: "right" }}>
            <button
              type="button"
              onClick={() => setView("forgot")}
              style={{
                background: "none",
                border: "none",
                color: "var(--sky-mid)",
                fontWeight: 600,
                fontSize: "0.82rem",
                cursor: "pointer",
                padding: 0,
              }}
            >
              ¿Olvidaste tu clave?
            </button>
          </p>
        )}

        <button
          type="submit"
          className="btn btn-primary"
          disabled={busy}
          style={{ width: "100%", marginTop: 18, padding: "13px 20px" }}
        >
          {busy ? "Procesando…" : tab === "registrar" ? "Crear cuenta" : "Ingresar"}
        </button>
      </form>

      <div className="auth-divider"><span>o</span></div>

      <p className="auth-alt">
        ¿Eres administrador de la iglesia?{" "}
        <Link href={`/admin/acceso${qs}`} style={{ color: "var(--sky-mid)", fontWeight: 700 }}>
          Entra con tu clave maestra
        </Link>
      </p>
    </div>
  );
}