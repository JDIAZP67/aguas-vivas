import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import DonationForm from "@/components/DonationForm";
import { headers } from "next/headers";
import { getTenant } from "@/lib/data";
import { resolveTenantSlugForRequest, searchParamSlug } from "@/lib/tenant";

export const metadata = {
  title: "Diezmos y ofrendas",
};

export default async function DonarPage({
  searchParams,
}: {
  searchParams: Promise<{ iglesia?: string | string[] }>;
}) {
  const slug = await resolveTenantSlugForRequest(
    await headers(),
    searchParamSlug((await searchParams)?.iglesia),
  );
  const tenant = await getTenant(slug);
  const donationInfo = tenant?.donation_info ?? null;
  const whatsapp = tenant?.whatsapp ?? null;

  return (
    <>
      <SiteHeader slug={slug} />

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

      <SiteFooter slug={slug} />
    </>
  );
}
