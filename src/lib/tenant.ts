import { createClient } from "@/lib/supabase/server";
import { DEFAULT_TENANT_SLUG } from "@/lib/constants";

const FALLBACK_NAME = "Aguas Vivas";

export async function getTenantName(): Promise<string> {
  try {
    const supabase = await createClient();
    const { data } = await supabase
      .from("tenants")
      .select("name")
      .eq("slug", DEFAULT_TENANT_SLUG)
      .maybeSingle();
    return data?.name || FALLBACK_NAME;
  } catch {
    return FALLBACK_NAME;
  }
}
