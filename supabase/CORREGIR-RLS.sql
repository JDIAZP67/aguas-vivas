-- ============================================================
-- AGUAS VIVAS · CORRECCIÓN DE SEGURIDAD RLS
-- Cierra el hueco por el que cualquier miembro podía cambiarse
-- su propio rol (autopromoción a super_admin).
--
-- Ejecutar UNA sola vez en: Supabase Dashboard → SQL Editor → Run
-- ============================================================

-- La política anterior solo tenía USING (sin WITH CHECK), por lo que
-- un usuario podía actualizar su propia fila y poner cualquier rol,
-- incluido 'super_admin'. Con el WITH CHECK se le exige conservar su
-- propio rol; solo un super_admin puede asignar roles.
drop policy if exists profiles_self_update on public.profiles;

create policy profiles_self_update on public.profiles
  for update
  using (
    id = auth.uid()
    or public.av_role() = 'super_admin'
  )
  with check (
    public.av_role() = 'super_admin'
    or (id = auth.uid() and role::text = public.av_role())
  );

-- ------------------------------------------------------------
-- VERIFICACIÓN (opcional): debe devolver una fila con rol super_admin
-- ------------------------------------------------------------
select u.email, p.role
from public.profiles p
join auth.users u on u.id = p.id
order by p.role;