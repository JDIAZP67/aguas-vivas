import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import DonationForm from "@/components/DonationForm";
import { createClient } from "@/lib/supabase/server";
import { DEFAULT_TENANT_SLUG } from "@/lib/constants";

export const metadata = {
  title: "Diezmos y ofrendas",
};

export default async function DonarPage() {
  let donationInfo: string | null = null;
  let whatsapp: string | null = null;

  try {
    const supabase = await createClient();
    const { data } = await supabase
      .from("tenants")
      .select("donation_info, whatsapp")
      .eq("slug", DEFAULT_TENANT_SLUG)
      .maybeSingle();
    donationInfo = data?.donation_info ?? null;
    whatsapp = data?.whatsapp ?? null;
  } catch {}

  return (
    <>
      <SiteHeader />

      <main className="block" style={{ paddingTop: 48 }}>
        <div className="section-inner">
          <div className="section-head" style={{ marginBottom: 36 }}>
            <div className="section-eyebrow">Mayordomía</div>
            <h2>Diezmos y ofrendas</h2>
            <p>
              «Traed todo el diezmo al alfolí y habrá alimento en mi casa;
              probadme ahora en esto, dice Jehová de los ejércitos, si no os
              abriré las ventanas de los cielos y derramaré sobre vosotros
              bendición hasta que sobreabunde.» — Malaquías 3:10 (RV1960)
            </p>
          </div>

          <blockquote
            style={{
              maxWidth: 640,
              margin: "0 auto 40px",
              borderLeft: "3px solid var(--gold)",
              paddingLeft: 18,
              fontSize: "0.95rem",
            }}
          >
            Cada uno según lo que haya propuesto en su corazón, no con
            tristeza ni por necesidad, porque Dios ama al dador alegre.
            <footer style={{ marginTop: 8, fontFamily: "var(--font-mono)", fontSize: "0.78rem", color: "var(--ink-soft)" }}>
              2 CORINTIOS 9:7 · REINA-VALERA 1960
            </footer>
          </blockquote>

          <DonationForm donationInfo={donationInfo} whatsapp={whatsapp} />
        </div>
      </main>

      <SiteFooter />
    </>
  );
}
