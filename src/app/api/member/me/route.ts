import { NextResponse } from "next/server";
import { getMemberSession } from "@/lib/member-auth";

export async function GET() {
  const member = await getMemberSession();
  if (!member) {
    return NextResponse.json({ ok: false, error: "No hay sesión activa." }, { status: 401 });
  }
  return NextResponse.json({
    ok: true,
    member: {
      id: member.id,
      tenant_id: member.tenant_id,
      email: member.email,
      full_name: member.full_name,
      role: member.role,
      level: member.level,
    },
  });
}