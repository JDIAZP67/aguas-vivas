import Link from "next/link";
import { getAdminProfile } from "@/lib/auth";
import { getDemoProfile } from "@/lib/demo-auth";

export default async function AuthPanel() {
  const real = await getAdminProfile();
  const demo = await getDemoProfile();
  const isReal = Boolean(real);

  const demoMode = !isReal && Boolean(demo);

  return (
    <div className="auth-card">
      <h1>Acceso al panel</h1>
      <p className="auth-sub">
        {demoMode
          ? "Ingresa para entrar al panel de demostración."
          : "Ingresa tu clave de acceso para administrar el sitio."}
      </p>

      <form method="POST" action="/api/auth/login">
        <div className="field full" style={{ marginBottom: 8 }}>
          <label htmlFor="clave">
            {demoMode ? "Correo o clave" : "Clave de acceso"}
          </label>
          <input
            id="clave"
            name="clave"
            required
            autoComplete="current-password"
          />
        </div>

        <button
          type="submit"
          className="btn btn-primary"
          style={{ width: "100%", marginTop: 18, padding: "13px 20px" }}
        >
          Ingresar
        </button>
      </form>

      {demoMode && (
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
