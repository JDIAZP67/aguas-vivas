-- ============================================================
-- AGUAS VIVAS · Fase 2 — Discipulado por niveles
-- Ejecutar en: Supabase Dashboard → SQL Editor (después de schema.sql)
-- ============================================================

-- ------------------------------------------------------------
-- 1. CURSOS (niveles de estudio)
-- ------------------------------------------------------------
create table if not exists public.courses (
  id          uuid primary key default gen_random_uuid(),
  tenant_id   uuid references public.tenants(id) on delete cascade,
  slug        text unique not null,
  level       int not null,
  title       text not null,
  tagline     text,
  description text,
  sort_order  int not null default 0,
  created_at  timestamptz not null default now()
);

-- ------------------------------------------------------------
-- 2. LECCIONES
-- ------------------------------------------------------------
create table if not exists public.lessons (
  id           uuid primary key default gen_random_uuid(),
  course_id    uuid references public.courses(id) on delete cascade,
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

-- ------------------------------------------------------------
-- 3. PROGRESO DEL ESTUDIANTE
-- ------------------------------------------------------------
create table if not exists public.lesson_progress (
  user_id      uuid references auth.users(id) on delete cascade,
  lesson_id    uuid references public.lessons(id) on delete cascade,
  completed_at timestamptz not null default now(),
  primary key (user_id, lesson_id)
);

-- ------------------------------------------------------------
-- 4. SEGURIDAD (RLS)
-- ------------------------------------------------------------
alter table public.courses         enable row level security;
alter table public.lessons         enable row level security;
alter table public.lesson_progress enable row level security;

drop policy if exists courses_public_read on public.courses;
create policy courses_public_read on public.courses for select using (true);

drop policy if exists courses_team_write on public.courses;
create policy courses_team_write on public.courses for all using (
  exists (
    select 1 from public.profiles p
    where p.id = auth.uid()
      and p.role in ('super_admin','pastor','maestro')
      and (p.role = 'super_admin' or p.tenant_id = courses.tenant_id)
  )
);

drop policy if exists lessons_public_read on public.lessons;
create policy lessons_public_read on public.lessons for select using (true);

drop policy if exists lessons_team_write on public.lessons;
create policy lessons_team_write on public.lessons for all using (
  exists (
    select 1 from public.profiles p
    join public.courses c on c.id = lessons.course_id
    where p.id = auth.uid()
      and p.role in ('super_admin','pastor','maestro')
      and (p.role = 'super_admin' or p.tenant_id = c.tenant_id)
  )
);

drop policy if exists progress_own_write on public.lesson_progress;
create policy progress_own_write on public.lesson_progress for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists progress_team_read on public.lesson_progress;
create policy progress_team_read on public.lesson_progress for select using (
  exists (
    select 1 from public.profiles me
    where me.id = auth.uid()
      and me.role in ('super_admin','pastor','maestro')
      and (
        me.role = 'super_admin'
        or lesson_progress.user_id in (
          select p.id from public.profiles p where p.tenant_id = me.tenant_id
        )
      )
  )
);
