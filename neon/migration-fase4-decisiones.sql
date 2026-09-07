-- Fase 4 — Seguimiento de decisiones
alter table salvation_decisions
  add column if not exists updated_at timestamptz not null default now();
create index if not exists decisions_tenant_status_idx
  on salvation_decisions (tenant_id, status);