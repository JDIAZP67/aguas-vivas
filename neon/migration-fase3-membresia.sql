-- Fase 3 — Membresía multi-iglesia
-- 1. Miembros (una cuenta por email dentro de cada iglesia)
create table if not exists members (
  id            uuid primary key default gen_random_uuid(),
  tenant_id     text not null default 'aguas-vivas',
  email         text not null,
  password_hash text not null,
  full_name     text not null,
  role          text not null default 'miembro'
                check (role in ('miembro','maestro','tesoreria','pastor')),
  status        text not null default 'active'
                check (status in ('pending','active','suspended')),
  level         int not null default 1,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);
create unique index if not exists members_tenant_email_idx on members (tenant_id, lower(email));
create index if not exists members_tenant_idx on members (tenant_id);

-- 2. Sesiones de miembro (token aleatorio, revocables)
create table if not exists member_sessions (
  token      text primary key,
  member_id  uuid not null references members(id) on delete cascade,
  created_at timestamptz not null default now(),
  expires_at timestamptz not null
);
create index if not exists member_sessions_expires_idx on member_sessions (expires_at);