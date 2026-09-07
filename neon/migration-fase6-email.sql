-- Fase 6 — Notificaciones por correo
-- Tokens de recuperación de clave de miembro
create table if not exists password_resets (
  token      text primary key,
  member_id  uuid not null references members(id) on delete cascade,
  created_at timestamptz not null default now(),
  expires_at timestamptz not null
);
create index if not exists password_resets_expires_idx on password_resets (expires_at);