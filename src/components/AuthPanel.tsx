"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function AuthPanel() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (busy) return;
    setBusy(true);
    setError(null);

    const fd = new FormData(e.currentTarget);
    const clave = String(fd.get("clave") ?? "").trim();

    try {
      if (!process.env.NEXT_PUBLIC_SUPABASE_URL && !process.env.DATABASE_URL) {
        if (!clave) {
          setError("Ingresa una clave para continuar.");
          return;
        }
        document.cookie = `${"av_demo_auth"}=1; path=/; max-age=${60 * 60 * 24 * 30}; samesite=lax`;
        router.push("/admin");
        router.refresh();
        return;
      }

      const res = await fetch("/api/auth/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ clave }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        setError(data.error ?? "Clave incorrecta.");
        return;
      }
      router.push("/admin");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error inesperado.");
    } finally {
      setBusy(false);
    }
  }

  const demo = !process.env.NEXT_PUBLIC_SUPABASE_URL && !process.env.DATABASE_URL;

  return (
    <div className="auth-card">
      <h1>Acceso al panel</h1>
      <p className="auth-sub">
        {demo
          ? "Ingresa para entrar al panel de demostración."
          : "Ingresa tu clave de acceso para administrar el sitio."}
      </p>

      <form onSubmit={handleSubmit}>
        <div className="field full" style={{ marginBottom: 8 }}>
          <label htmlFor="clave">
            {demo ? "Correo o clave" : "Clave de acceso"}
          </label>
          <input
            id="clave"
            name="clave"
            required
            autoComplete="current-password"
          />
        </div>

        {error && (
          <div className="form-status err" role="alert" style={{ whiteSpace: "pre-line" }}>
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={busy}
          className="btn btn-primary"
          style={{ width: "100%", marginTop: 18, padding: "13px 20px" }}
        >
          {busy ? "Verificando…" : "Ingresar"}
        </button>
      </form>

      {demo && (
        <div className="form-status" style={{ marginTop: 16 }}>
          🧪 Modo demostración: usa cualquier clave para entrar al panel. Los
          cambios no se guardan en base de datos.
        </div>
      )}

      <p className="auth-alt" style={{ marginTop: 22 }}>
        ¿Aún no conoces a Jesús?{" "}
        <Link href="/plan-de-salvacion" style={{ color: "var(--sky-mid)", fontWeight: 700 }}>
          Comienza por aquí
        </Link>
      </p>
    </div>
  );
}
