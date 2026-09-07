import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { MEMBER_AUTH_COOKIE } from "@/lib/member-auth";

export async function POST() {
  const store = await cookies();
  const token = store.get(MEMBER_AUTH_COOKIE)?.value;
  if (token) {
    try {
      const db = await import("@/lib/db");
      await db.deleteMemberSession(token);
    } catch {
      // sin base de datos: aun así se limpia la cookie
    }
    store.delete(MEMBER_AUTH_COOKIE);
  }
  return NextResponse.json({ ok: true });
}