-- ============================================================
-- AGUAS VIVAS · Fase 4 — Mayordomía
-- Ejecutar en: Supabase Dashboard → SQL Editor (después de fase 3)
-- ============================================================

-- ------------------------------------------------------------
-- 1. TRANSACCIONES (ingresos y egresos)
--    Ingresos:  pendiente (donación en línea sin confirmar) → confirmado (+ comprobante)
--    Egresos:   pendiente_aprobacion → aprobado | rechazado  (solo Pastor aprueba)
-- ------------------------------------------------------------
create table if not exists public.transactions (
  id                uuid primary key default gen_random_uuid(),
  tenant_id         uuid references public.tenants(id) on delete cascade,
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
  on public.transactions (tenant_id, occurred_at);

-- Instrucciones de donación visibles en la página pública
alter table public.tenants add column if not exists donation_info text;

-- ------------------------------------------------------------
-- 2. SEGURIDAD (RLS) — usa av_role()/av_tenant() de schema.sql
--    El rol Mantenimiento NO tiene acceso a este módulo.
-- ------------------------------------------------------------
alter table public.transactions enable row level security;

drop policy if exists tx_finance_read on public.transactions;
create policy tx_finance_read on public.transactions for select using (
  public.av_role() in ('super_admin','pastor','tesoreria')
  and (
    public.av_role() = 'super_admin'
    or public.av_tenant() = transactions.tenant_id
  )
);

-- Cualquier persona puede enviar una intención de donación (queda pendiente)
drop policy if exists tx_public_donate on public.transactions;
create policy tx_public_donate on public.transactions
  for insert with check (kind = 'ingreso' and status = 'pendiente');

-- Tesorería / Pastor / Súper Admin registran manualmente
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

-- ------------------------------------------------------------
-- 3. SEMILLA — instrucciones de ejemplo editables en Configuración
-- ------------------------------------------------------------
update public.tenants
set donation_info =
E'Banco de Crédito (BCP)\nCuenta corriente soles: 000-0000000-00\nCCI: 002-000-0000000000-00\n\nYape / Plin: +51 987 654 321\nTitular: Iglesia Aguas Vivas\n\nTambién puedes dar desde cualquier país vía PayPal: iglesia@correo.org'
where slug = 'aguas-vivas' and donation_info is null;
