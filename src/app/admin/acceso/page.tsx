import Link from "next/link";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";

export const metadata = {
  title: "Acceso administrador",
};

export default function AdminAccesoPage() {
  return (
    <>
      <SiteHeader />
      <main className="auth-shell">
        <div className="auth-card">
          <h1>Acceso al panel</h1>
          <p className="auth-sub">
            Ingresa tu clave maestra de administración para gestionar la iglesia.
          </p>

          <form method="POST" action="/api/auth/login">
            <div className="field full" style={{ marginBottom: 8 }}>
              <label htmlFor="clave">Clave de acceso</label>
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

          <p className="auth-alt" style={{ marginTop: 22 }}>
            ¿Eres miembro?{" "}
            <Link href="/acceso" style={{ color: "var(--sky-mid)", fontWeight: 700 }}>
              Entra por el área de miembros
            </Link>
          </p>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}