-- ============================================================
-- AGUAS VIVAS · Fase 3 — Videoconferencias / En vivo
-- Ejecutar en: Supabase Dashboard → SQL Editor (después de fase 2)
-- ============================================================

-- ------------------------------------------------------------
-- 1. SESIONES (predicación dominical, clases por nivel, anuncios)
-- ------------------------------------------------------------
create table if not exists public.sessions (
  id          uuid primary key default gen_random_uuid(),
  tenant_id   uuid references public.tenants(id) on delete cascade,
  title       text not null,
  type        text not null default 'predicacion' check (type in ('predicacion','clase','anuncio')),
  course_id   uuid references public.courses(id) on delete set null,
  host_name   text,
  starts_at   timestamptz,
  duration_min int default 60,
  video_url   text,
  notes       text,
  status      text not null default 'programada' check (status in ('programada','en_vivo','finalizada')),
  created_at  timestamptz not null default now()
);

create index if not exists sessions_tenant_status_idx on public.sessions (tenant_id, status, starts_at);

-- ------------------------------------------------------------
-- 2. SEGURIDAD (RLS)
-- ------------------------------------------------------------
alter table public.sessions enable row level security;

drop policy if exists sessions_public_read on public.sessions;
create policy sessions_public_read on public.sessions for select using (true);

drop policy if exists sessions_team_write on public.sessions;
create policy sessions_team_write on public.sessions for all using (
  exists (
    select 1 from public.profiles p
    where p.id = auth.uid()
      and p.role in ('super_admin','pastor','maestro')
      and (p.role = 'super_admin' or p.tenant_id = sessions.tenant_id)
  )
);

-- ------------------------------------------------------------
-- 3. SEMILLA DE EJEMPLO (se puede eliminar desde el panel)
-- ------------------------------------------------------------
insert into public.sessions (tenant_id, title, type, host_name, starts_at, duration_min, status, notes)
select t.id, 'Predicación dominical — Fundamentos de fe', 'predicacion', 'Pastorado',
       now() + interval '3 days', 60, 'programada',
       'Servicio general abierto a toda la congregación y visitantes.'
from public.tenants t
where t.slug = 'aguas-vivas'
  and not exists (select 1 from public.sessions s where s.tenant_id = t.id);

insert into public.sessions (tenant_id, title, type, host_name, starts_at, duration_min, video_url, status, notes)
select t.id, 'Anuncios de la semana', 'anuncio', 'Equipo pastoral',
       now() - interval '7 days', 20, null, 'finalizada',
       'Actividades, bautismos y avisos generales.'
from public.tenants t
where t.slug = 'aguas-vivas'
  and (select count(*) from public.sessions s where s.tenant_id = t.id) < 2;
