import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import AuthPanel from "@/components/AuthPanel";

export const metadata = {
  title: "Acceso de miembros",
};

export default function AccesoPage() {
  return (
    <>
      <SiteHeader />
      <main className="auth-shell">
        <AuthPanel />
      </main>
      <SiteFooter />
    </>
  );
}
