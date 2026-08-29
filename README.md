# 🌊 Aguas Vivas — Plataforma Evangelística y de Discipulado

> *"Id por todo el mundo y predicad el evangelio a toda criatura."* — Marcos 16:15

Plataforma web para que una iglesia evangélica **evangelice en línea** (Plan de Salvación con registro de decisiones de fe), **discipule** por niveles y, en fases futuras, **administre su mayordomía** — construida para escalar hacia un modelo multi-iglesia usable en todo el mundo.

**Stack:** Next.js 16 · React 19 · Supabase (Postgres + Auth + RLS) · TypeScript

> ⚡ **Modo demostración:** el proyecto puede ejecutarse **sin base de datos conectada**.
> Si falta la variable `NEXT_PUBLIC_SUPABASE_URL`, el sitio funciona en *modo demo*
> con el **Nivel 1 completo** incluido en el propio código. Esto te permite publicarlo
> en GitHub/Vercel de inmediato y revisarlo sin tocar ningún dashboard. Para activar
> el guardado de datos real, solo conecta tu base de datos (ver sección **Modo demo vs.
> modo producción** abajo).

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

## ✨ Modo demo vs. modo producción

El sitio detecta automáticamente el modo en el que corre:

| | **Modo demostración** | **Modo producción** |
|---|---|---|
| Condición | Sin `NEXT_PUBLIC_SUPABASE_URL` | Con la URL y key de tu base de datos |
| Estudios | Nivel 1 completo incluido en el código (`src/lib/demo-data.ts`) | Leído desde la base de datos |
| Registro/login | Desactivado (aviso amable) | Activo (Supabase Auth) |
| Progreso de estudios | No se guarda | Se guarda por usuario |
| Decisiones de fe / donaciones | No disponible | Disponible |
| Publicación | Funciona en Vercel/GitHub Pages sin nada más | Requiere la base de datos |

**¿Cómo cambio de demo a producción?**

1. Crea tu cuenta en tu proveedor de datos (ej. Supabase, Neon, PlanetScale, etc.).
2. Ejecuta el esquema inicial y los scripts SQL de fases (`supabase/schema*.sql`).
3. En **Vercel → Settings → Environment Variables**, agrega:
   - `NEXT_PUBLIC_SUPABASE_URL` = tu URL
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY` = tu clave pública
4. Redepliega el proyecto. Al detectar la URL, el sitio pasa automáticamente a usar la
   base de datos real; el contenido demo solo aparece como respaldo si la BD no responde.

> La capa de datos vive centralizada en `src/lib/data.ts` (con `src/lib/demo-data.ts` como
> respaldo), así que cambiar de base de datos más adelante es un cambio en un solo punto.

**Demo de transmisión en vivo:** en modo demo, la sección "En vivo" de la home muestra un
**video de ejemplo** (Big Buck Bunny, clip público) con el badge **EN VIVO**, y lista las
**próximas sesiones** de muestra en las pestañas laterales. Esto sirve para previsualizar el
diseño del reproductor sin necesidad de base de datos. Cuando conectes la BD y crees tus
sesiones reales en `/admin/en-vivo`, se reemplaza automáticamente.

## ✅ Qué incluye la Fase 1 (MVP Evangelístico)

| Módulo | Estado |
|---|---|
| Sitio público con identidad "Aguas Vivas" | ✅ Listo |
| ⭐ **Plan de Salvación** (4 verdades con versículos RV1960 + oración de fe) | ✅ Listo |
| Formulario de decisión → guardado en BD | ✅ Listo |
| Bandeja de decisiones para el pastorado | ✅ En `/admin` |
| Registro/login de miembros (Supabase Auth) | ✅ Listo |
| Configuración de iglesia editable | ✅ En `/admin` |
| 📖 **Nivel 1 Fundamentos: 12 lecciones completas** con progreso | ✅ En `/estudios` |
| 🔴 **Transmisiones en vivo** (YouTube) + biblioteca de grabaciones | ✅ `/admin/en-vivo` · `/biblioteca` |
| 💛 **Mayordomía**: donaciones con comprobante, egresos aprobados por el pastor, reporte mensual CSV | ✅ `/donar` · `/admin/mayordomia` |
| Niveles 2 y 3 del discipulado | 🔜 Fase siguiente |
| Multi-iglesia + inglés/portugués | 🔜 Fase 5 |

### Activar los estudios, transmisiones y mayordomía (Fases 2-4)

Después del `schema.sql`, ejecuta en el SQL Editor de Supabase en este orden:

1. `supabase/schema-fase2.sql` + `supabase/seed-nivel1.sql` — estudios
2. `supabase/schema-fase3.sql` — sesiones en vivo (incluye ejemplos)
3. `supabase/schema-fase4.sql` — finanzas (diezmos, ofrendas y egresos)

### Cómo transmitir en vivo

1. Crea una cuenta de YouTube de la iglesia y activa la transmisión en vivo (gratis).
2. En `/admin/en-vivo`, programa la sesión con fecha y pega el enlace de YouTube.
3. Al comenzar, presiona **Iniciar 🔴**: la home muestra el reproductor automáticamente.
4. Al terminar, presiona **Finalizar**: la grabación queda en `/biblioteca`.

### Cómo funciona la mayordomía

1. Edita las cuentas bancarias/Yape de la iglesia en `/admin` → Configuración → "Cuentas para diezmos".
2. El donante entra a `/donar`, registra su ofrenda y queda **por confirmar**.
3. Tesorería la verifica y presiona **Confirmar** → se genera el comprobante (código AV-XXXX).
4. Los egresos los solicita Tesorería y **solo el Pastor** los aprueba o rechaza.
5. En `/admin/mayordomia` navega por meses y exporta el reporte en CSV.
6. La página principal muestra públicamente el total del mes (transparencia).

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
