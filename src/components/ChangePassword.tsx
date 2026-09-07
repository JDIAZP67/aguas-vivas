"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function ChangePassword({ iglesia }: { iglesia: string }) {
  const router = useRouter();
  const [actual, setActual] = useState("");
  const [nueva, setNueva] = useState("");
  const [nueva2, setNueva2] = useState("");
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(ev: React.FormEvent) {
    ev.preventDefault();
    setError("");
    setInfo("");
    setBusy(true);
    try {
      const res = await fetch(`/api/member/change-password?iglesia=${encodeURIComponent(iglesia)}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ current: actual, nueva }),
      });
      const data = await res.json();
      if (res.ok) {
        setInfo("Clave actualizada correctamente.");
        setActual("");
        setNueva("");
        setNueva2("");
      } else {
        setError(data.error ?? "No se pudo cambiar la clave.");
      }
    } catch {
      setError("No se pudo cambiar la clave.");
    } finally {
      setBusy(false);
      if (info) router.refresh();
    }
  }

  return (
    <form onSubmit={submit} className="card" style={{ padding: 20 }}>
      <b style={{ display: "block", marginBottom: 12 }}>Cambiar mi clave</b>

      <div className="field full" style={{ marginBottom: 8 }}>
        <label htmlFor="actual">Clave actual</label>
        <input
          id="actual"
          type="password"
          value={actual}
          onChange={(e) => setActual(e.target.value)}
          required
          autoComplete="current-password"
        />
      </div>

      <div className="field full" style={{ marginBottom: 8 }}>
        <label htmlFor="nueva">Clave nueva</label>
        <input
          id="nueva"
          type="password"
          value={nueva}
          onChange={(e) => setNueva(e.target.value)}
          required
          minLength={6}
          autoComplete="new-password"
        />
      </div>

      <div className="field full" style={{ marginBottom: 8 }}>
        <label htmlFor="nueva2">Repetir clave nueva</label>
        <input
          id="nueva2"
          type="password"
          value={nueva2}
          onChange={(e) => setNueva2(e.target.value)}
          required
          minLength={6}
          autoComplete="new-password"
        />
      </div>

      {error && (
        <div className="form-status" style={{ marginTop: 10, color: "#b3261e" }}>{error}</div>
      )}
      {info && (
        <div className="form-status" style={{ marginTop: 10, color: "var(--ok)" }}>{info}</div>
      )}

      <button
        type="submit"
        className="btn btn-primary"
        disabled={busy || (nueva.length > 0 && nueva !== nueva2)}
        style={{ marginTop: 14 }}
      >
        {busy ? "Guardando…" : "Actualizar clave"}
      </button>
    </form>
  );
}