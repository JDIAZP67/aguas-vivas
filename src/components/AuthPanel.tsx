import { headers } from "next/headers";
import { resolveTenantSlugForRequest } from "@/lib/tenant";
import MemberAuthPanel from "@/components/MemberAuthPanel";
import { getTenant } from "@/lib/data";

export default async function AuthPanel() {
  const slug = await resolveTenantSlugForRequest(await headers());
  const tenant = await getTenant(slug);
  return <MemberAuthPanel slug={slug} tenantName={tenant?.name ?? "Aguas Vivas"} />;
}