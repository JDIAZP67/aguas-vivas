import { cookies } from "next/headers";
import type { Member } from "./types";
import { isDemoMode } from "./data";

export const MEMBER_AUTH_COOKIE = "av_member";
const SESSION_DAYS = 30;

export function memberSessionMaxAge(): number {
  return 60 * 60 * 24 * SESSION_DAYS;
}

export function memberCookieOptions() {
  return {
    path: "/",
    maxAge: memberSessionMaxAge(),
    httpOnly: true,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
  };
}

export function memberSessionExpires(): string {
  return new Date(Date.now() + memberSessionMaxAge() * 1000).toISOString();
}

export async function getMemberSession(): Promise<Member | null> {
  if (isDemoMode()) return null;
  try {
    const store = await cookies();
    const token = store.get(MEMBER_AUTH_COOKIE)?.value;
    if (!token) return null;
    const { getMemberBySession } = await import("@/lib/db");
    return await getMemberBySession(token);
  } catch {
    return null;
  }
}