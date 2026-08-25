import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { DEFAULT_TENANT_SLUG } from "@/lib/constants";
import type { Tenant, Profile } from "@/lib/types";
import ConfigForm from "@/components/ConfigForm";
import AdminShell from "@/components/AdminShell";

export const metadata = {
  title: "Panel de administración — Aguas Vivas",
};

export default async function AdminPage() {
  const supabase = await createClient();

  let user = null;
  try {
    const {
      data: { user: u },
    } = await supabase.auth.getUser();
    user = u;
  } catch {
    user = null;
  }

  if (!user) redirect("/acceso");

  let profile: Profile | null = null;
  try {
    const { data } = await supabase
      .from("profiles")
      .select("id, tenant_id, full_name, role")
      .eq("id", user.id)
      .maybeSingle();
    profile = (data as Profile) ?? null;
  } catch {
    profile = null;
  }

  let tenant: Tenant | null = null;
  try {
    const { data } = await supabase
      .from("tenants")
      .select("*")
      .eq("slug", DEFAULT_TENANT_SLUG)
      .maybeSingle();
    tenant = (data as Tenant) ?? null;
  } catch {
    tenant = null;
  }

  interface DecisionRow {
    id: string;
    full_name: string;
    email: string | null;
    phone: string | null;
    country: string | null;
    city: string | null;
    status: string;
    created_at: string;
  }
  const decisions: DecisionRow[] = [];
  if (
    tenant &&
    profile &&
    ["super_admin", "pastor", "maestro"].includes(profile.role)
  ) {
    try {
      const { data } = await supabase
        .from("salvation_decisions")
        .select(
          "id, full_name, email, phone, country, city, status, created_at",
        )
        .eq("tenant_id", tenant.id)
        .order("created_at", { ascending: false })
        .limit(15);
      decisions.push(...((data as DecisionRow[]) ?? []));
    } catch {}
  }

  const supabaseConfigured =
    Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL) && Boolean(tenant);

  return (
    <AdminShell active="/admin" profile={profile}>
      <div className="page-head">
        <div>
          <div className="page-eyebrow">Configuración de la iglesia</div>
          <h1>{tenant?.name ?? "Aguas Vivas"}</h1>
        </div>
      </div>
      <p className="subhead">
        Esta información se usa en la página pública de la iglesia y en los
        comprobantes y certificados que se generen.
      </p>

      {!supabaseConfigured && (
        <div className="perm-note">
          <span>⚙️</span>
          <div>
            <b>Supabase no está conectado</b>
            Crea tu proyecto en supabase.com, ejecuta los archivos{" "}
            <code>supabase/schema*.sql</code> en el SQL Editor, copia tus
            credenciales al archivo <code>.env.local</code> y reinicia el
            servidor.
          </div>
        </div>
      )}

      {tenant && <ConfigForm tenant={tenant} />}

      {decisions.length > 0 && (
        <>
          <div style={{ height: 30 }} />
          <div className="page-head">
            <div>
              <div className="page-eyebrow">Evangelismo</div>
              <h1 style={{ fontSize: "1.5rem" }}>
                Decisiones de fe recientes
              </h1>
            </div>
            <span className="save-note">{decisions.length} registro(s)</span>
          </div>
          <p className="subhead">
            Personas que oraron el Plan de Salvación y dejaron su contacto. ¡Da
            seguimiento cuanto antes!
          </p>
          <div className="card">
            <table className="simple-table">
              <thead>
                <tr>
                  <th>Nombre</th>
                  <th>Contacto</th>
                  <th>Ubicación</th>
                  <th>Fecha</th>
                </tr>
              </thead>
              <tbody>
                {decisions.map((d) => (
                  <tr key={d.id}>
                    <td>{d.full_name}</td>
                    <td>
                      {[d.email, d.phone].filter(Boolean).join(" · ") || "—"}
                    </td>
                    <td>
                      {[d.city, d.country].filter(Boolean).join(", ") || "—"}
                    </td>
                    <td style={{ whiteSpace: "nowrap" }}>
                      {new Date(d.created_at).toLocaleDateString("es-PE", {
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                      })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <p style={{ marginTop: 18 }}>
            <Link href="/admin/en-vivo" style={{ color: "var(--sky-mid)", fontWeight: 700, fontSize: "0.9rem" }}>
              Gestionar transmisiones y clases →
            </Link>
          </p>
        </>
      )}
    </AdminShell>
  );
}
