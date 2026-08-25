import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { DEFAULT_TENANT_SLUG } from "@/lib/constants";

export async function POST(request: Request) {
  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { ok: false, error: "Solicitud inválida." },
      { status: 400 },
    );
  }

  const website = typeof body.website === "string" ? body.website : "";
  if (website.length > 0) {
    return NextResponse.json({ ok: true });
  }

  const fullName = String(body.fullName ?? "").trim();
  const email = String(body.email ?? "").trim() || null;
  const phone = String(body.phone ?? "").trim() || null;

  if (!fullName || (!email && !phone)) {
    return NextResponse.json(
      {
        ok: false,
        error:
          "Completa tu nombre y al menos un medio de contacto (correo o teléfono).",
      },
      { status: 400 },
    );
  }

  const supabase = await createClient();

  const { data: tenant, error: tenantErr } = await supabase
    .from("tenants")
    .select("id")
    .eq("slug", DEFAULT_TENANT_SLUG)
    .maybeSingle();

  if (tenantErr || !tenant) {
    console.error("[decision] tenant no encontrado:", tenantErr?.message);
    return NextResponse.json(
      { ok: false, error: "sin_conexion" },
      { status: 503 },
    );
  }

  const clean = (v: unknown, max: number) => {
    const s = String(v ?? "").trim();
    return s ? s.slice(0, max) : null;
  };

  const { error: insertErr } = await supabase
    .from("salvation_decisions")
    .insert({
      tenant_id: tenant.id,
      full_name: fullName.slice(0, 120),
      email,
      phone,
      country: clean(body.country, 80),
      city: clean(body.city, 80),
      message: clean(body.message, 2000),
    });

  if (insertErr) {
    console.error("[decision] error al insertar:", insertErr.message);
    return NextResponse.json(
      { ok: false, error: "sin_conexion" },
      { status: 503 },
    );
  }

  return NextResponse.json({ ok: true });
}
