-- Aguas Vivas · Esquema para Neon (Postgres)
-- Tabla de sesiones: transmisiones / clases / grabaciones de video

create extension if not exists "pgcrypto";

create table if not exists sessions (
  id uuid primary key default gen_random_uuid(),
  tenant_id text not null default 'aguas-vivas',
  title text not null,
  type text not null default 'predicacion',
  course_id text,
  host_name text,
  starts_at timestamptz,
  duration_min int,
  video_url text,
  notes text,
  status text not null default 'programada',
  created_at timestamptz not null default now()
);

create index if not exists sessions_status_idx on sessions (status);
create index if not exists sessions_starts_at_idx on sessions (starts_at desc);
create index if not exists sessions_tenant_idx on sessions (tenant_id);
