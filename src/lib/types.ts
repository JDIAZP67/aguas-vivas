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

export const ROLE_LABELS: Record<AppRole, string> = {
  super_admin: 'Súper Administrador',
  pastor: 'Pastor / Admin. de iglesia',
  mantenimiento: 'Mantenimiento',
  tesoreria: 'Tesorería',
  maestro: 'Maestro / Líder',
  miembro: 'Miembro',
}
