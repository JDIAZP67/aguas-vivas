# 🌊 Aguas Vivas — Plataforma Evangelística y de Discipulado

> *"Id por todo el mundo y predicad el evangelio a toda criatura."* — Marcos 16:15

Plataforma web para que una iglesia evangélica **evangelice en línea** (Plan de Salvación con registro de decisiones de fe), **discipule** por niveles y **administre su mayordomía** — construida sobre el modelo multi-iglesia.

**Stack:** Next.js 16 · React 19 · Neon (Postgres serverless) · TypeScript

> ⚡ **Modo demostración:** el proyecto puede ejecutarse **sin base de datos conectada**.
> Si falta la variable `DATABASE_URL`, el sitio funciona en *modo demo* con el
> **Nivel 1 completo** incluido en el propio código. Esto te permite publicarlo
> en Vercel de inmediato y revisarlo. Para activar el guardado de datos real, solo
> conecta tu base de datos Neon (ver abajo).

---

## 📁 Estructura del proyecto

```
aguas-vivas/
├── neon/
│   └── schema.sql              ← Esquema BD consolidado (ejecutar en Neon)
├── src/
│   ├── app/
│   │   ├── page.tsx              ← Sitio público (home)
│   │   ├── plan-de-salvacion/    ← ⭐ Plan de Salvación + decisión de fe
│   │   ├── acceso/               ← Acceso al panel (clave maestra)
│   │   ├── admin/                ← Panel de administración
│   │   └── api/
│   │       ├── decision/         ← Guarda decisiones de fe
│   │       ├── tenant/           ← Actualiza datos de la iglesia
│   │       ├── courses/          ← CRUD de niveles de estudio
│   │       ├── lessons/          ← CRUD de lecciones
│   │       ├── progress/         ← Progreso de estudios
│   │       ├── sessions/         ← Transmisiones y videos
│   │       └── transactions/     ← Mayordomía (donaciones, egresos)
│   ├── components/           ← Header, Footer, formularios y managers
│   └── lib/                  ← Capa Neon (`db.ts`), tipos, constantes
└── .env.local                ← Credenciales (no subir a git)
```

## 🚀 Puesta en marcha

### 1. Crear la base de datos en Neon (gratis, sin tarjeta)

1. Entra a [neon.tech](https://neon.tech) → **Sign up** con tu correo y **confirma** el enlace.
2. Crea un proyecto (nombre: `aguas-vivas`, región cercana).
3. Pulsa **Connect** → copia la **connection string** (empieza en `postgresql://…@…neon.tech/…`).

### 2. Ejecutar el esquema

1. En tu proyecto Neon → **SQL Editor** → **New query**
2. Copia **todo** el contenido de `neon/schema.sql`, pégalo y presiona **Run**
3. Crea las tablas (`tenants`, `salvation_decisions`, `courses`, `lessons`,
   `lesson_progress`, `sessions`, `transactions`) y registra la iglesia inicial
   con contenido de ejemplo.

### 3. Conectar credenciales

Copia el archivo `.env.local.example` a `.env.local` y completa:

```
DATABASE_URL=postgresql://usuario:contraseña@ep-xxxx.region.aws.neon.tech/neondb?sslmode=require
ADMIN_KEY=tu-clave-maestra-secreta
```

### 4. Levantar el sitio

```bash
npm run dev        # desarrollo → http://localhost:3000
npm run build && npm run start   # producción local
```

### 5. Publicarlo en internet (gratis)

1. Sube el repo a GitHub
2. Entra a [vercel.com](https://vercel.com) → **Import project**
3. En **Settings → Environment Variables**, agrega `DATABASE_URL` y `ADMIN_KEY`
4. Deploy → tendrás dominio `xxx.vercel.app`. Luego puedes conectar tu propio dominio (ej. `aguasvivas.org`).

> Sin variables de entorno, el deploy corre en **modo demo** y se puede revisar igualmente.

---

## ✨ Modo demo vs. modo producción

| | **Modo demostración** | **Modo producción** |
|---|---|---|
| Condición | Sin `DATABASE_URL` | Con `DATABASE_URL` conectada |
| Estudios | Nivel 1 completo incluido en el código (`src/lib/demo-data.ts`) | Leído desde la base de datos |
| Acceso al panel | Cualquier clave (demo) | Clave maestra (`ADMIN_KEY`) |
| Progreso de estudios | No se guarda | Se guarda en Neon |
| Decisiones de fe / donaciones | Simuladas | Guardadas en Neon |
| Publicación | Funciona en Vercel sin nada más | Requiere la base de datos |

**¿Cómo cambio de demo a producción?**

1. Crea tu proyecto en Neon y ejecuta `neon/schema.sql`.
2. En **Vercel → Settings → Environment Variables**, agrega `DATABASE_URL` y `ADMIN_KEY`.
3. Redeploy. Al detectar `DATABASE_URL`, el sitio pasa automáticamente a usar la base de
   datos real; el contenido demo solo aparece como respaldo si la BD no responde.

> La capa de datos vive centralizada en `src/lib/db.ts` (con `src/lib/demo-data.ts` como
> respaldo demo), así que si alguna vez cambias de proveedor, es un cambio en un solo punto.

## ✅ Qué incluye el proyecto

| Módulo | Estado |
|---|---|
| Sitio público con identidad "Aguas Vivas" | ✅ Listo |
| ⭐ **Plan de Salvación** (4 verdades con versículos RV1960 + oración de fe) | ✅ Listo |
| Formulario de decisión → guardado en Neon | ✅ Listo |
| 📖 **Nivel 1 Fundamentos: 12 lecciones** con gestión en el panel | ✅ `/estudios` · `/admin/estudios` |
| 🔴 **Transmisiones en vivo** (YouTube) + biblioteca de grabaciones | ✅ `/admin/en-vivo` · `/biblioteca` |
| 💛 **Mayordomía**: donaciones con comprobante, egresos aprobados por el pastor, reporte mensual CSV | ✅ `/donar` · `/admin/mayordomia` |
| Configuración de iglesia editable | ✅ En `/admin` |
| Niveles 2 y 3 del discipulado | 🔜 Fase siguiente |
| Multi-iglesia + inglés/portugués | 🔜 Fase futura |

### Cómo transmitir en vivo

1. Crea una cuenta de YouTube de la iglesia y activa la transmisión en vivo (gratis).
2. En `/admin/en-vivo`, programa la sesión con fecha y pega el enlace de YouTube.
3. Al comenzar, presiona **Iniciar 🔴**: la home muestra el reproductor automáticamente.
4. Al terminar, presiona **Finalizar**: la grabación queda en `/biblioteca` disponible 24/7.

### Cómo funciona la mayordomía

1. Edita las cuentas bancarias/Yape de la iglesia en el panel → Configuración → "Cuentas para diezmos".
2. El donante entra a `/donar`, registra su ofrenda y queda **por confirmar**.
3. En `/admin/mayordomia` se confirma → se genera el comprobante (código AV-XXXX).
4. Los egresos quedan **pendientes de aprobación** y solo se aprueban con la clave maestra.
5. Navega por meses y exporta el reporte en CSV.

## 🔒 Seguridad incluida

- Acceso al panel mediante **clave maestra** (`ADMIN_KEY`), verificada en el servidor.
- La clave y la conexión a la base de datos viven en variables de entorno; nunca en el código.
- La cookie de sesión es `httpOnly` y `secure` en producción.
- Formulario protegido contra spam básico (honeypot).
- Los secretos en `.env.local` nunca se suben al repositorio.

> 🔐 **No compartas tu contraseña de correo en ningún chat.** Solo se necesita la
> **connection string** de Neon y tu **clave maestra**; ambas van como variables de
> entorno, nunca en el código.