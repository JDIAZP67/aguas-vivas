import { DEFAULT_TENANT_SLUG } from "@/lib/constants";

const FALLBACK_NAME = "Aguas Vivas";

export async function getTenantName(): Promise<string> {
  try {
    if (!process.env.DATABASE_URL) return FALLBACK_NAME;
    const { getTenantName: dbName } = await import("@/lib/db");
    return (await dbName(DEFAULT_TENANT_SLUG)) || FALLBACK_NAME;
  } catch {
    return FALLBACK_NAME;
  }
}