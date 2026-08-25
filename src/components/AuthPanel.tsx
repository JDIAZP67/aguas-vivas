"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

type Mode = "login" | "signup";

export default function AuthPanel() {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>("login");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (busy) return;
    setBusy(true);
    setError(null);
    setNotice(null);

    const fd = new FormData(e.currentTarget);
    const email = String(fd.get("email") ?? "").trim();
    const password = String(fd.get("password") ?? "");
    const fullName = String(fd.get("fullName") ?? "").trim();

    try {
      const supabase = createClient();

      if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
        throw new Error(
          "Supabase aún no está configurado. Revisa el archivo .env.local del proyecto.",
        );
      }

      if (mode === "login") {
        const { error: err } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (err) {
          setError(err.message === "Invalid login credentials"
            ? "Correo o contraseña incorrectos."
            : err.message);
          return;
        }
        router.push("/admin");
        router.refresh();
      } else {
        const { data, error: err } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/auth/callback`,
            data: { full_name: fullName },
          },
        });
        if (err) {
          setError(err.message);
          return;
        }
        if (data.session) {
          router.push("/admin");
          router.refresh();
        } else {
          setNotice(
            "¡Cuenta creada! Revisa tu correo electrónico para confirmar tu registro y luego inicia sesión.",
          );
          setMode("login");
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error inesperado.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="auth-card">
      <h1>{mode === "login" ? "Bienvenido de nuevo" : "Únete a la familia"}</h1>
      <p className="auth-sub">
        {mode === "login"
          ? "Ingresa para acceder a tus estudios y a la comunidad."
          : "Crea tu cuenta gratuita y comienza el Nivel 1 de formación bíblica."}
      </p>

      <div className="tabs" style={{ marginBottom: 24 }}>
        <button
          type="button"
          className={`tab-btn ${mode === "login" ? "active" : ""}`}
          onClick={() => {
            setMode("login");
            setError(null);
            setNotice(null);
          }}
        >
          Iniciar sesión
        </button>
        <button
          type="button"
          className={`tab-btn ${mode === "signup" ? "active" : ""}`}
          onClick={() => {
            setMode("signup");
            setError(null);
            setNotice(null);
          }}
        >
          Crear cuenta
        </button>
      </div>

      <form onSubmit={handleSubmit}>
        {mode === "signup" && (
          <div className="field full" style={{ marginBottom: 16 }}>
            <label htmlFor="fullName">Nombre completo</label>
            <input id="fullName" name="fullName" required maxLength={120} />
          </div>
        )}
        <div className="field full" style={{ marginBottom: 16 }}>
          <label htmlFor="email">Correo electrónico</label>
          <input id="email" name="email" type="email" required />
        </div>
        <div className="field full" style={{ marginBottom: 8 }}>
          <label htmlFor="password">Contraseña</label>
          <input
            id="password"
            name="password"
            type="password"
            required
            minLength={6}
            placeholder={mode === "signup" ? "Mínimo 6 caracteres" : ""}
          />
        </div>

        {error && (
          <div className="form-status err" role="alert">
            {error}
          </div>
        )}
        {notice && (
          <div className="form-status ok" role="status">
            {notice}
          </div>
        )}

        <button
          type="submit"
          disabled={busy}
          className="btn btn-primary"
          style={{ width: "100%", marginTop: 18, padding: "13px 20px" }}
        >
          {busy
            ? "Procesando…"
            : mode === "login"
              ? "Ingresar"
              : "Crear mi cuenta gratis"}
        </button>
      </form>

      <p className="auth-alt" style={{ marginTop: 22 }}>
        ¿Aún no conoces a Jesús?{" "}
        <Link href="/plan-de-salvacion" style={{ color: "var(--sky-mid)", fontWeight: 700 }}>
          Comienza por aquí
        </Link>
      </p>
    </div>
  );
}
