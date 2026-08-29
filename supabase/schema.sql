-- ============================================================
-- AGUAS VIVAS · Fase 1 — Base del sistema
-- Ejecutar en: Supabase Dashboard → SQL Editor (PRIMERO)
-- ============================================================

-- ------------------------------------------------------------
-- 1. IGLESIAS (tenants)
-- ------------------------------------------------------------
create table if not exists public.tenants (
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
  plan             text not null default 'free' check (plan in ('free','premium')),
  status           text not null default 'active' check (status in ('pending','active','suspended')),
  created_at       timestamptz not null default now()
);

-- ------------------------------------------------------------
-- 2. PERFILES DE USUARIO (vinculados a Supabase Auth)
--    roles: super_admin, pastor, mantenimiento, tesoreria, maestro, miembro
-- ------------------------------------------------------------
do $$ begin
  create type public.app_role as enum
    ('super_admin','pastor','mantenimiento','tesoreria','maestro','miembro');
exception when duplicate_object then null; end $$;

create table if not exists public.profiles (
  id         uuid primary key references auth.users(id) on delete cascade,
  tenant_id  uuid references public.tenants(id) on delete set null,
  full_name  text,
  role       public.app_role not null default 'miembro',
  created_at timestamptz not null default now()
);

-- Crea automáticamente el perfil al registrarse (toma el nombre del signup)
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, tenant_id, full_name, role)
  values (
    new.id,
    (select id from public.tenants where slug = 'aguas-vivas'),
    coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
    'miembro'
  );
  return new;
end $$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ------------------------------------------------------------
-- 3. DECISIONES DE FE (formulario Plan de Salvación)
-- ------------------------------------------------------------
create table if not exists public.salvation_decisions (
  id         uuid primary key default gen_random_uuid(),
  tenant_id  uuid references public.tenants(id) on delete cascade,
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

-- ------------------------------------------------------------
-- 4. IGLESIA SEMILLA — Aguas Vivas
-- ------------------------------------------------------------
insert into public.tenants (
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

-- ------------------------------------------------------------
-- 5. SEGURIDAD (RLS)
--    Funciones auxiliares SECURITY DEFINER: leen rol e iglesia
--    del usuario SIN disparar las políticas de la tabla profiles
--    (evita "infinite recursion detected in policy").
-- ------------------------------------------------------------
create or replace function public.av_role() returns text
language sql stable security definer set search_path = public as $$
  select role::text from public.profiles where id = auth.uid()
$$;

create or replace function public.av_tenant() returns uuid
language sql stable security definer set search_path = public as $$
  select tenant_id from public.profiles where id = auth.uid()
$$;

alter table public.tenants enable row level security;
alter table public.profiles enable row level security;
alter table public.salvation_decisions enable row level security;

-- Tenants: lectura pública (datos de contacto), escritura solo equipo pastoral
drop policy if exists tenants_public_read on public.tenants;
create policy tenants_public_read on public.tenants for select using (true);

drop policy if exists tenants_team_write on public.tenants;
create policy tenants_team_write on public.tenants for update using (
  public.av_role() in ('super_admin','pastor','mantenimiento')
  and (
    public.av_role() = 'super_admin'
    or public.av_tenant() = tenants.id
  )
);

-- Perfiles: cada quien ve su perfil; pastorado ve los de su iglesia
drop policy if exists profiles_self_read on public.profiles;
drop policy if exists profiles_self_update on public.profiles;
create policy profiles_self_read on public.profiles for select using (
  id = auth.uid()
  or (
    public.av_role() in ('super_admin','pastor')
    and (
      public.av_role() = 'super_admin'
      or public.av_tenant() = profiles.tenant_id
    )
  )
);

create policy profiles_self_update on public.profiles
  for update
  using (
    id = auth.uid()
    or public.av_role() = 'super_admin'
  )
  -- Un miembro solo puede editar su perfil conservando su propio rol;
  -- únicamente un super_admin puede asignar roles.
  with check (
    public.av_role() = 'super_admin'
    or (id = auth.uid() and role::text = public.av_role())
  );

-- Decisiones de fe: cualquiera puede escribir (evangelismo);
-- solo pastorado/súper admin las lee y gestiona
drop policy if exists decisions_public_insert on public.salvation_decisions;
create policy decisions_public_insert on public.salvation_decisions
  for insert with check (true);

drop policy if exists decisions_team_read on public.salvation_decisions;
drop policy if exists decisions_team_update on public.salvation_decisions;
create policy decisions_team_read on public.salvation_decisions for select using (
  public.av_role() in ('super_admin','pastor','maestro')
  and (
    public.av_role() = 'super_admin'
    or public.av_tenant() = salvation_decisions.tenant_id
  )
);

create policy decisions_team_update on public.salvation_decisions for update using (
  public.av_role() in ('super_admin','pastor','maestro')
  and (
    public.av_role() = 'super_admin'
    or public.av_tenant() = salvation_decisions.tenant_id
  )
);
