import { cookies } from "next/headers";
import { isDemoMode } from "./data";
import type { Profile } from "./types";

export const DEMO_AUTH_COOKIE = "av_demo_auth";

export async function getDemoProfile(): Promise<Profile | null> {
  if (!isDemoMode()) return null;
  const store = await cookies();
  if (store.get(DEMO_AUTH_COOKIE)?.value !== "1") return null;
  return {
    id: "demo-admin",
    tenant_id: "demo-tenant-aguas-vivas",
    full_name: "Pastor Demo",
    role: "pastor",
  };
}
