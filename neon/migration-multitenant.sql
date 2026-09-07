-- Fase 2 — Multi-iglesia
-- 1. Dominio propio por iglesia
alter table tenants add column if not exists primary_domain text;
create unique index if not exists tenants_primary_domain_key on tenants (primary_domain);

-- 2. Slug de curso único por iglesia (antes era global)
alter table courses drop constraint if exists courses_slug_key;
create unique index if not exists courses_tenant_slug_idx on courses (tenant_id, slug);