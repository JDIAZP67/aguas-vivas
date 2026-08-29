-- ============================================================
-- AGUAS VIVAS · PASO 2 — REPARACIÓN DE POLÍTICAS RLS
-- Corrige el error "infinite recursion detected in policy"
--
-- Cómo funciona: dos funciones auxiliares SECURITY DEFINER leen
-- tu rol e iglesia SIN disparar las políticas de la tabla
-- profiles (esa era la causa de la recursión).
-- Ejecutar TODO en el SQL Editor de Supabase → Run.
-- ============================================================

-- ------------------------------------------------------------
-- 1. FUNCIONES AUXILIARES
-- ------------------------------------------------------------
create or replace function public.av_role() returns text
language sql stable security definer set search_path = public as $$
  select role::text from public.profiles where id = auth.uid()
$$;

create or replace function public.av_tenant() returns uuid
language sql stable security definer set search_path = public as $$
  select tenant_id from public.profiles where id = auth.uid()
$$;

-- Para usuarios anónimos devuelven NULL automáticamente:
-- las políticas "públicas" siguen permitiendo leer contenido evangelístico.

-- ============================================================
-- 2. TENANTS (iglesias)
-- ============================================================
alter table public.tenants enable row level security;

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

-- ============================================================
-- 3. PROFILES (usuarios) — aquí estaba la recursión
-- ============================================================
alter table public.profiles enable row level security;

drop policy if exists profiles_self_read on public.profiles;
drop policy if exists profiles_self_update on public.profiles;
drop policy if exists profiles_team_read on public.profiles;
drop policy if exists profiles_admin_update on public.profiles;

-- Cada quien ve su perfil; pastorado ve los de su iglesia
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

-- Cada quien edita lo básico de su perfil; solo súper admin cambia roles
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

-- ============================================================
-- 4. SALVATION_DECISIONS (decisiones de fe)
-- ============================================================
alter table public.salvation_decisions enable row level security;

drop policy if exists decisions_public_insert on public.salvation_decisions;
create policy decisions_public_insert on public.salvation_decisions
  for insert with check (true);

drop policy if exists decisions_team_read on public.salvation_decisions;
drop policy if exists decisions_team_update on public.salvation_decisions;
drop policy if exists decisions_team_all on public.salvation_decisions;

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

-- ============================================================
-- 5. COURSES y LESSONS (estudios)
-- ============================================================
alter table public.courses enable row level security;
alter table public.lessons enable row level security;

drop policy if exists courses_public_read on public.courses;
create policy courses_public_read on public.courses for select using (true);

drop policy if exists courses_team_write on public.courses;
create policy courses_team_write on public.courses for all using (
  public.av_role() in ('super_admin','pastor','maestro')
  and (
    public.av_role() = 'super_admin'
    or public.av_tenant() = courses.tenant_id
  )
);

drop policy if exists lessons_public_read on public.lessons;
create policy lessons_public_read on public.lessons for select using (true);

drop policy if exists lessons_team_write on public.lessons;
create policy lessons_team_write on public.lessons for all using (
  public.av_role() in ('super_admin','pastor','maestro')
  and (
    public.av_role() = 'super_admin'
    or exists (
      select 1 from public.courses c
      where c.id = lessons.course_id
        and c.tenant_id = public.av_tenant()
    )
  )
);

-- ============================================================
-- 6. LESSON_PROGRESS (progreso del estudiante)
-- ============================================================
alter table public.lesson_progress enable row level security;

drop policy if exists progress_own_write on public.lesson_progress;
drop policy if exists progress_team_read on public.lesson_progress;

-- Cada estudiante gestiona su propio progreso
create policy progress_own_write on public.lesson_progress for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- El equipo docente consulta el avance de los alumnos de su iglesia
create policy progress_team_read on public.lesson_progress for select using (
  public.av_role() in ('super_admin','pastor','maestro')
  and (
    public.av_role() = 'super_admin'
    or exists (
      select 1 from public.profiles student
      where student.id = lesson_progress.user_id
        and student.tenant_id = public.av_tenant()
    )
  )
);

-- ============================================================
-- 7. SESSIONS (transmisiones en vivo)
-- ============================================================
alter table public.sessions enable row level security;

drop policy if exists sessions_public_read on public.sessions;
create policy sessions_public_read on public.sessions for select using (true);

drop policy if exists sessions_team_write on public.sessions;
create policy sessions_team_write on public.sessions for all using (
  public.av_role() in ('super_admin','pastor','maestro')
  and (
    public.av_role() = 'super_admin'
    or public.av_tenant() = sessions.tenant_id
  )
);

-- ============================================================
-- 8. TRANSACTIONS (mayordomía)
--    Mantenimiento queda excluido por diseño.
-- ============================================================
alter table public.transactions enable row level security;

drop policy if exists tx_finance_read on public.transactions;
create policy tx_finance_read on public.transactions for select using (
  public.av_role() in ('super_admin','pastor','tesoreria')
  and (
    public.av_role() = 'super_admin'
    or public.av_tenant() = transactions.tenant_id
  )
);

-- Donación pública: cualquiera puede registrar una intención pendiente
drop policy if exists tx_public_donate on public.transactions;
create policy tx_public_donate on public.transactions
  for insert with check (kind = 'ingreso' and status = 'pendiente');

-- Tesorería/Pastor registran ingresos confirmados y solicitan egresos
drop policy if exists tx_finance_insert on public.transactions;
create policy tx_finance_insert on public.transactions for insert with check (
  public.av_role() in ('super_admin','pastor','tesoreria')
  and (
    public.av_role() = 'super_admin'
    or public.av_tenant() = transactions.tenant_id
  )
);

drop policy if exists tx_finance_update on public.transactions;
create policy tx_finance_update on public.transactions for update using (
  public.av_role() in ('super_admin','pastor','tesoreria')
  and (
    public.av_role() = 'super_admin'
    or public.av_tenant() = transactions.tenant_id
  )
);

drop policy if exists tx_pastor_delete on public.transactions;
create policy tx_pastor_delete on public.transactions for delete using (
  public.av_role() in ('super_admin','pastor')
  and (
    public.av_role() = 'super_admin'
    or public.av_tenant() = transactions.tenant_id
  )
);
