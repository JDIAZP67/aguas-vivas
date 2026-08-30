import { cookies } from "next/headers";
import type { Profile } from "./types";

export const ADMIN_AUTH_COOKIE = "av_admin_auth";
export const ADMIN_KEY = process.env.ADMIN_KEY ?? "";

export function hasAuthConfigured(): boolean {
  return Boolean(process.env.DATABASE_URL);
}

export async function getAdminProfile(): Promise<Profile | null> {
  if (!process.env.DATABASE_URL) return null;
  const store = await cookies();
  if (store.get(ADMIN_AUTH_COOKIE)?.value !== "1") return null;
  return {
    id: "admin",
    tenant_id: "aguas-vivas",
    full_name: "Administrador",
    role: "pastor",
  };
}
