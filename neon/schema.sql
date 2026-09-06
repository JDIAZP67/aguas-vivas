-- ============================================================
-- AGUAS VIVAS · Esquema consolidado para Neon (Postgres)
-- Un solo archivo. Ejecutar en: Neon Console → SQL Editor
-- ============================================================

create extension if not exists "pgcrypto";

-- ------------------------------------------------------------
-- 0. IGLESIA (tenant único, slug = aguas-vivas)
-- ------------------------------------------------------------
create table if not exists tenants (
  id               uuid primary key default gen_random_uuid(),
  slug             text unique not null,
  name             text not null,
  country          text,
  city             text,
  address          text,
  description      text,
  logo_url         text,
  brand_color      text default '#0a3b5c',
  contact_email    text,
  contact_phone    text,
  whatsapp         text,
  facebook         text,
  instagram        text,
  youtube          text,
  service_schedule text,
  donation_info    text,
  plan             text not null default 'free' check (plan in ('free','premium')),
  status           text not null default 'active' check (status in ('pending','active','suspended')),
  created_at       timestamptz not null default now()
);

-- ------------------------------------------------------------
-- 1. DECISIONES DE FE (formulario Plan de Salvación)
-- ------------------------------------------------------------
create table if not exists salvation_decisions (
  id         uuid primary key default gen_random_uuid(),
  tenant_id  text not null default 'aguas-vivas',
  full_name  text not null,
  email      text,
  phone      text,
  country    text,
  city       text,
  message    text,
  status     text not null default 'nuevo'
             check (status in ('nuevo','contactado','discipulado','integrado')),
  created_at timestamptz not null default now()
);

create index if not exists decisions_tenant_created_idx
  on salvation_decisions (tenant_id, created_at desc);

-- ------------------------------------------------------------
-- 2. CURSOS (niveles de estudio)
-- ------------------------------------------------------------
create table if not exists courses (
  id          uuid primary key default gen_random_uuid(),
  tenant_id   text not null default 'aguas-vivas',
  slug        text unique not null,
  level       int not null,
  title       text not null,
  tagline     text,
  description text,
  sort_order  int not null default 0,
  created_at  timestamptz not null default now()
);

create index if not exists courses_tenant_order_idx
  on courses (tenant_id, sort_order);

-- ------------------------------------------------------------
-- 3. LECCIONES
-- ------------------------------------------------------------
create table if not exists lessons (
  id           uuid primary key default gen_random_uuid(),
  course_id    uuid references courses(id) on delete cascade,
  slug         text not null,
  title        text not null,
  module_label text,
  verse_ref    text,
  body         text not null,
  duration_min int default 15,
  sort_order   int not null,
  created_at   timestamptz not null default now(),
  unique (course_id, slug)
);

create index if not exists lessons_course_order_idx
  on lessons (course_id, sort_order);

-- ------------------------------------------------------------
-- 4. PROGRESO DEL ESTUDIANTE (clave maestra)
--    Sin cuentas de usuario: progreso registrado bajo 'admin'.
-- ------------------------------------------------------------
create table if not exists lesson_progress (
  user_ref     text not null default 'admin',
  lesson_id    uuid references lessons(id) on delete cascade,
  completed_at timestamptz not null default now(),
  primary key (user_ref, lesson_id)
);

-- ------------------------------------------------------------
-- 5. SESIONES (transmisiones / clases / grabaciones de video)
-- ------------------------------------------------------------
create table if not exists sessions (
  id          uuid primary key default gen_random_uuid(),
  tenant_id   text not null default 'aguas-vivas',
  title       text not null,
  type        text not null default 'predicacion',
  course_id   text,
  host_name   text,
  starts_at   timestamptz,
  duration_min int,
  video_url   text,
  notes       text,
  status      text not null default 'programada',
  created_at  timestamptz not null default now()
);

create index if not exists sessions_status_idx on sessions (status);
create index if not exists sessions_starts_at_idx on sessions (starts_at desc);
create index if not exists sessions_tenant_idx on sessions (tenant_id);

-- ------------------------------------------------------------
-- 6. MAYORDOMÍA (ingresos y egresos)
--    Ingresos:  pendiente (donación en línea sin confirmar) → confirmado (+ comprobante)
--    Egresos:   pendiente_aprobacion → aprobado | rechazado
-- ------------------------------------------------------------
create table if not exists transactions (
  id                uuid primary key default gen_random_uuid(),
  tenant_id         text not null default 'aguas-vivas',
  kind              text not null check (kind in ('ingreso','egreso')),
  category          text not null default 'ofrenda',
  amount            numeric(12,2) not null check (amount > 0),
  currency          text not null default 'PEN',
  description       text,
  occurred_at       timestamptz not null default now(),

  donor_name        text,
  donor_email       text,
  donor_phone       text,
  method            text,

  requested_by_name text,
  approval_status   text check (approval_status in ('pendiente_aprobacion','aprobado','rechazado')),
  approved_by_name  text,
  approved_at       timestamptz,

  status            text not null default 'confirmado'
                    check (status in ('pendiente','confirmado','pendiente_aprobacion','aprobado','rechazado')),
  receipt_code      text unique,
  created_at        timestamptz not null default now()
);

create index if not exists transactions_tenant_occurred_idx
  on transactions (tenant_id, occurred_at);

-- ============================================================
-- SEMILLA — contenido inicial de ejemplo
-- ============================================================

insert into tenants (
  slug, name, country, city, address, description, contact_email,
  service_schedule, plan, status
)
values (
  'aguas-vivas',
  'Aguas Vivas — Casa de Fe',
  'Perú', 'Lima',
  'Av. La Fe 123, Lima',
  'Iglesia cristiana evangélica: evangelizar con el mensaje de la cruz, discipular nuevos creyentes y enviar obreros a la cosecha.',
  'contacto@aguasvivas.org',
  'Domingo 10:00 am · Miércoles 7:00 pm · Sábado 6:00 pm (Jóvenes)',
  'free', 'active'
)
on conflict (slug) do nothing;

update tenants
set donation_info =
E'Banco de Crédito (BCP)\nCuenta corriente soles: 000-0000000-00\nCCI: 002-000-0000000000-00\n\nYape / Plin: +51 987 654 321\nTitular: Iglesia Aguas Vivas\n\nTambién puedes dar desde cualquier país vía PayPal: iglesia@correo.org'
where slug = 'aguas-vivas' and donation_info is null;

insert into sessions (tenant_id, title, type, host_name, starts_at, duration_min, status, notes)
values (
  'aguas-vivas', 'Predicación dominical — Fundamentos de fe', 'predicacion', 'Pastorado',
  now() + interval '3 days', 60, 'programada',
  'Servicio general abierto a toda la congregación y visitantes.'
)
where not exists (
  select 1 from sessions s where s.title = 'Predicación dominical — Fundamentos de fe'
);

insert into sessions (tenant_id, title, type, host_name, starts_at, duration_min, status, notes)
values (
  'aguas-vivas', 'Anuncios de la semana', 'anuncio', 'Equipo pastoral',
  now() - interval '7 days', 20, 'finalizada',
  'Actividades, bautismos y avisos generales.'
)
where not exists (
  select 1 from sessions s where s.title = 'Anuncios de la semana'
);