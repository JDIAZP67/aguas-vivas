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

export const ROLE_LABELS: Record<AppRole, string> = {
  super_admin: 'Súper Administrador',
  pastor: 'Pastor / Admin. de iglesia',
  mantenimiento: 'Mantenimiento',
  tesoreria: 'Tesorería',
  maestro: 'Maestro / Líder',
  miembro: 'Miembro',
}
