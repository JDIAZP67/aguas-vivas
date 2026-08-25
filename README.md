# 🌊 Aguas Vivas — Plataforma Evangelística y de Discipulado

> *"Id por todo el mundo y predicad el evangelio a toda criatura."* — Marcos 16:15

Plataforma web para que una iglesia evangélica **evangelice en línea** (Plan de Salvación con registro de decisiones de fe), **discipule** por niveles y, en fases futuras, **administre su mayordomía** — construida para escalar hacia un modelo multi-iglesia usable en todo el mundo.

**Stack:** Next.js 16 · React 19 · Supabase (Postgres + Auth + RLS) · TypeScript

---

## 📁 Estructura del proyecto

```
aguas-vivas/
├── supabase/
│   └── schema.sql            ← Esquema BD (ejecutar en Supabase)
├── src/
│   ├── app/
│   │   ├── page.tsx              ← Sitio público (home)
│   │   ├── plan-de-salvacion/    ← ⭐ Plan de Salvación + decisión de fe
│   │   ├── acceso/               ← Registro / login de miembros
│   │   ├── admin/                ← Panel de administración
│   │   ├── auth/callback/        ← Confirmación de correo
│   │   └── api/
│   │       ├── decision/         ← Guarda decisiones de fe
│   │       └── tenant/           ← Actualiza datos de la iglesia
│   ├── components/           ← Header, Footer, formularios
│   └── lib/                  ← Clientes Supabase, tipos, constantes
└── .env.local                ← Credenciales (no subir a git)
```

## 🚀 Puesta en marcha

### 1. Crear el proyecto en Supabase (gratis)

1. Entra a [supabase.com](https://supabase.com) → **New project**
2. Nombre: `aguas-vivas` · Elige región cercana (ej. `us-east`)
3. Guarda la contraseña que te pida.

### 2. Ejecutar el esquema

1. En tu proyecto Supabase → icono **SQL Editor** → **New query**
2. Copia **todo** el contenido de `supabase/schema.sql`, pégalo y presiona **Run**
3. Esto crea las tablas (`tenants`, `profiles`, `salvation_decisions`), los roles, las políticas de seguridad (RLS) y registra tu iglesia inicial.

### 3. Conectar credenciales

1. En Supabase → **Project Settings → API**
2. Copia `Project URL` y `anon public key`
3. Pégalas en el archivo `.env.local`:

```
NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
```

### 4. Levantar el sitio

```bash
npm run dev        # desarrollo → http://localhost:3000
npm run build && npm run start   # producción local
```

### 5. Publicarlo en internet (gratis)

1. Sube el repo a GitHub
2. Entra a [vercel.com](https://vercel.com) → **Import project**
3. Agrega las 2 variables de entorno de `.env.local`
4. Deploy → tendrás dominio `xxx.vercel.app`. Luego puedes conectar tu propio dominio (ej. `aguasvivas.org`).

---

## ✅ Qué incluye la Fase 1 (MVP Evangelístico)

| Módulo | Estado |
|---|---|
| Sitio público con identidad "Aguas Vivas" | ✅ Listo |
| ⭐ **Plan de Salvación** (4 verdades + oración de fe) | ✅ Listo |
| Formulario de decisión → guardado en BD | ✅ Listo |
| Bandeja de decisiones para el pastorado | ✅ En `/admin` |
| Registro/login de miembros (Supabase Auth) | ✅ Listo |
| Configuración de iglesia editable | ✅ En `/admin` |
| Roles preparados (pastor, mantenimiento, tesorería…) | 🔜 Fases 2-4 |
| Niveles de discipulado (LMS) | 🔜 Fase 2 |
| Transmisión en vivo | 🔜 Fase 3 |
| Diezmos/ofrendas en línea | 🔜 Fase 4 |
| Multi-iglesia + inglés/portugués | 🔜 Fase 5 |

## 👥 Primer usuario pastor

Cuando crees tu cuenta en `/acceso`, conviértela en pastor desde el SQL Editor de Supabase:

```sql
update public.profiles set role = 'pastor' where id = (
  select id from auth.users order by created_at limit 1
);
```

Ese usuario podrá editar la configuración de la iglesia y ver las decisiones de fe.

## 🔒 Seguridad incluida

- **RLS activo**: cualquiera puede *enviar* una decisión de fe; solo pastor/súper admin puede *leerlas*.
- Contraseñas y sesiones gestionadas por Supabase Auth (nunca se tocan manualmente).
- Formulario protegido contra spam básico (honeypot).
- Las claves en `.env.local` nunca se suben al repositorio.
