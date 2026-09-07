"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";

type Tab = "ingresar" | "registrar";

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

  const [tab, setTab] = useState<Tab>("ingresar");
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [clave, setClave] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(ev: React.FormEvent) {
    ev.preventDefault();
    setError("");
    setBusy(true);
    const endpoint = tab === "registrar" ? "/api/member/register" : "/api/member/login";
    try {
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
      setError("No se pudo completar el acceso.");
    } finally {
      setBusy(false);
    }
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