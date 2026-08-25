import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { DEFAULT_TENANT_SLUG } from "@/lib/constants";

const ALLOWED_FIELDS = [
  "name",
  "country",
  "city",
  "address",
  "description",
  "brand_color",
  "contact_email",
  "contact_phone",
  "whatsapp",
  "facebook",
  "instagram",
  "youtube",
  "service_schedule",
] as const;

export async function PUT(request: Request) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json(
      { ok: false, error: "Debes iniciar sesión." },
      { status: 401 },
    );
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role, tenant_id")
    .eq("id", user.id)
    .maybeSingle();

  const role = profile?.role;
  if (!profile || (role !== "pastor" && role !== "super_admin")) {
    return NextResponse.json(
      { ok: false, error: "No tienes permisos para editar la configuración de la iglesia." },
      { status: 403 },
    );
  }

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { ok: false, error: "Solicitud inválida." },
      { status: 400 },
    );
  }

  const name = String(body.name ?? "").trim();
  if (!name) {
    return NextResponse.json(
      { ok: false, error: "El nombre de la iglesia es obligatorio." },
      { status: 400 },
    );
  }

  const updates: Record<string, string> = { name: name.slice(0, 160) };
  for (const field of ALLOWED_FIELDS) {
    if (field === "name") continue;
    if (typeof body[field] === "string") {
      updates[field] = String(body[field]).trim().slice(0, 2000);
    }
  }
  if (!/^#[0-9a-fA-F]{6}$/.test(updates.brand_color ?? "")) {
    updates.brand_color = "#0a3b5c";
  }

  const { data: tenant } = await supabase
    .from("tenants")
    .select("id")
    .eq("slug", DEFAULT_TENANT_SLUG)
    .maybeSingle();

  if (!tenant) {
    return NextResponse.json(
      { ok: false, error: "La iglesia no existe en la base de datos. Ejecuta supabase/schema.sql." },
      { status: 404 },
    );
  }

  const { error: updateErr } = await supabase
    .from("tenants")
    .update(updates)
    .eq("id", tenant.id);

  if (updateErr) {
    console.error("[tenant] error al actualizar:", updateErr.message);
    return NextResponse.json(
      { ok: false, error: "No se pudieron guardar los cambios en la base de datos." },
      { status: 503 },
    );
  }

  return NextResponse.json({ ok: true });
}
