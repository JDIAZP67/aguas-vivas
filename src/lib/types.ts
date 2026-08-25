export type AppRole =
  | 'super_admin'
  | 'pastor'
  | 'mantenimiento'
  | 'tesoreria'
  | 'maestro'
  | 'miembro'

export interface Tenant {
  id: string
  slug: string
  name: string
  country: string | null
  city: string | null
  address: string | null
  description: string | null
  logo_url: string | null
  brand_color: string | null
  contact_email: string | null
  contact_phone: string | null
  whatsapp: string | null
  facebook: string | null
  instagram: string | null
  youtube: string | null
  service_schedule: string | null
  donation_info: string | null
  plan: 'free' | 'premium'
  status: 'pending' | 'active' | 'suspended'
}

export interface Profile {
  id: string
  tenant_id: string | null
  full_name: string | null
  role: AppRole
}

export interface SalvationDecision {
  id: string
  tenant_id: string | null
  full_name: string
  email: string | null
  phone: string | null
  country: string | null
  city: string | null
  message: string | null
  status: 'nuevo' | 'contactado' | 'discipulado' | 'integrado'
  created_at: string
}

export type SessionType = "predicacion" | "clase" | "anuncio"
export type SessionStatus = "programada" | "en_vivo" | "finalizada"

export interface Session {
  id: string
  tenant_id: string | null
  title: string
  type: SessionType
  course_id: string | null
  host_name: string | null
  starts_at: string | null
  duration_min: number | null
  video_url: string | null
  notes: string | null
  status: SessionStatus
}

export const SESSION_TYPE_LABELS: Record<SessionType, string> = {
  predicacion: "Predicación dominical",
  clase: "Clase por nivel",
  anuncio: "Anuncios",
}

export const SESSION_STATUS_LABELS: Record<SessionStatus, string> = {
  programada: "Programada",
  en_vivo: "En vivo",
  finalizada: "Finalizada",
}

export type TxKind = "ingreso" | "egreso"

export interface Transaction {
  id: string
  tenant_id: string | null
  kind: TxKind
  category: string
  amount: number | string
  currency: string
  description: string | null
  occurred_at: string
  donor_name: string | null
  donor_email: string | null
  donor_phone: string | null
  method: string | null
  requested_by_name: string | null
  approval_status: "pendiente_aprobacion" | "aprobado" | "rechazado" | null
  approved_by_name: string | null
  approved_at: string | null
  status: string
  receipt_code: string | null
}

export const INCOME_CATEGORIES = [
  { value: "diezmo", label: "Diezmos" },
  { value: "ofrenda", label: "Ofrendas generales" },
  { value: "donacion", label: "Donación especial" },
  { value: "otros_ingreso", label: "Otros ingresos" },
] as const

export const EXPENSE_CATEGORIES = [
  { value: "pago_pastor", label: "Pago pastor principal" },
  { value: "pago_copastores", label: "Pago copastores" },
  { value: "servicios", label: "Servicios (internet/streaming)" },
  { value: "mantenimiento", label: "Mantenimiento del templo" },
  { value: "misiones", label: "Misiones / evangelismo" },
  { value: "otros_egreso", label: "Otros egresos" },
] as const

export const PAYMENT_METHODS = [
  { value: "transferencia", label: "Transferencia bancaria" },
  { value: "yape_plin", label: "Yape / Plin" },
  { value: "tarjeta", label: "Tarjeta" },
  { value: "efectivo", label: "Efectivo" },
  { value: "otro", label: "Otro" },
] as const

export function categoryLabel(
  category: string,
  kind: TxKind,
): string {
  const list = kind === "ingreso"
    ? [...INCOME_CATEGORIES]
    : [...EXPENSE_CATEGORIES]
  return list.find((c) => c.value === category)?.label ?? category
}

export function methodLabel(method: string | null): string {
  if (!method) return "—"
  return PAYMENT_METHODS.find((m) => m.value === method)?.label ?? method
}

export const ROLE_LABELS: Record<AppRole, string> = {
  super_admin: 'Súper Administrador',
  pastor: 'Pastor / Admin. de iglesia',
  mantenimiento: 'Mantenimiento',
  tesoreria: 'Tesorería',
  maestro: 'Maestro / Líder',
  miembro: 'Miembro',
}
