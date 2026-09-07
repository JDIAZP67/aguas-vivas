import { neon } from "@neondatabase/serverless";
import { randomBytes } from "node:crypto";
import type {
  Member,
  SalvationDecision,
  Session,
  Tenant,
  Transaction,
} from "./types";
import type { Course, Lesson } from "./lesson";

const DATABASE_URL = process.env.DATABASE_URL;

export function hasDatabase(): boolean {
  return Boolean(DATABASE_URL);
}

function client() {
  if (!DATABASE_URL) throw new Error("DATABASE_URL no configurada");
  return neon(DATABASE_URL);
}

function toSession(row: Record<string, unknown>): Session {
  return {
    id: String(row.id),
    tenant_id: row.tenant_id ? String(row.tenant_id) : null,
    title: String(row.title),
    type: (row.type as Session["type"]) ?? "predicacion",
    course_id: row.course_id ? String(row.course_id) : null,
    host_name: row.host_name ? String(row.host_name) : null,
    starts_at: row.starts_at ? String(row.starts_at) : null,
    duration_min: row.duration_min != null ? Number(row.duration_min) : null,
    video_url: row.video_url ? String(row.video_url) : null,
    notes: row.notes ? String(row.notes) : null,
    status: (row.status as Session["status"]) ?? "programada",
  };
}

const COLS = [
  "id",
  "tenant_id",
  "title",
  "type",
  "course_id",
  "host_name",
  "starts_at",
  "duration_min",
  "video_url",
  "notes",
  "status",
];

export async function createSession(input: Session): Promise<Session> {
  const sql = client();
  const cols = COLS;
  const vals = COLS.map((c) => {
    const k = c as keyof Session;
    const v = input[k];
    if (v === undefined) return null;
    if (c === "starts_at" && v === "") return null;
    return v;
  });
  const placeholders = vals.map((_, i) => `$${i + 1}`);
  const rows = await sql.query(
    `insert into sessions (${cols.join(", ")})
     values (${placeholders.join(", ")})
     returning *`,
    vals,
  );
  return toSession(rows[0] as Record<string, unknown>);
}

export async function updateSession(
  id: string,
  tenantId: string,
  input: Record<string, unknown>,
): Promise<Session | null> {
  const sql = client();
  const entries = Object.entries(input).filter(
    ([k, v]) => v !== undefined && k !== "id",
  );

  if (entries.length === 0) {
    const r = await sql.query(
      "select * from sessions where id = $1 and tenant_id = $2",
      [id, tenantId],
    );
    return r.length ? toSession(r[0] as Record<string, unknown>) : null;
  }

  const setCols: string[] = [];
  const vals: unknown[] = [];
  for (const [k, v] of entries) {
    vals.push(v);
    setCols.push(`${k} = $${vals.length}`);
  }
  vals.push(tenantId, id);

  const rows = await sql.query(
    `update sessions set ${setCols.join(", ")} where id = $${entries.length + 2} and tenant_id = $${entries.length + 1} returning *`,
    vals,
  );
  return rows.length ? toSession(rows[0] as Record<string, unknown>) : null;
}

export async function deleteSession(id: string, tenantId: string): Promise<boolean> {
  const sql = client();
  const rows = await sql.query(
    "delete from sessions where id = $1 and tenant_id = $2 returning id",
    [id, tenantId],
  );
  return rows.length > 0;
}

export async function listSessions(tenantId: string, status?: string): Promise<Session[]> {
  const sql = client();
  const rows = status
    ? await sql.query(
        "select * from sessions where tenant_id = $1 and status = $2 order by starts_at desc",
        [tenantId, status],
      )
    : await sql.query(
        "select * from sessions where tenant_id = $1 order by starts_at desc",
        [tenantId],
      );
  return (rows as unknown as Record<string, unknown>[]).map(toSession);
}

// ----------------------------------------------------------------------------
// Tenants
// ----------------------------------------------------------------------------

function toTenant(row: Record<string, unknown>): Tenant {
  return {
    id: String(row.id),
    slug: String(row.slug),
    name: String(row.name),
    primary_domain: row.primary_domain ? String(row.primary_domain) : null,
    country: row.country ? String(row.country) : null,
    city: row.city ? String(row.city) : null,
    address: row.address ? String(row.address) : null,
    description: row.description ? String(row.description) : null,
    logo_url: row.logo_url ? String(row.logo_url) : null,
    brand_color: row.brand_color ? String(row.brand_color) : "#0a3b5c",
    contact_email: row.contact_email ? String(row.contact_email) : null,
    contact_phone: row.contact_phone ? String(row.contact_phone) : null,
    whatsapp: row.whatsapp ? String(row.whatsapp) : null,
    facebook: row.facebook ? String(row.facebook) : null,
    instagram: row.instagram ? String(row.instagram) : null,
    youtube: row.youtube ? String(row.youtube) : null,
    service_schedule: row.service_schedule ? String(row.service_schedule) : null,
    donation_info: row.donation_info ? String(row.donation_info) : null,
    plan: (row.plan as Tenant["plan"]) ?? "free",
    status: (row.status as Tenant["status"]) ?? "active",
  };
}

export async function getTenantRow(slug: string): Promise<Tenant | null> {
  const sql = client();
  const rows = await sql.query("select * from tenants where slug = $1 limit 1", [slug]);
  return rows.length ? toTenant(rows[0] as Record<string, unknown>) : null;
}

export async function getTenantName(slug: string): Promise<string | null> {
  const sql = client();
  const rows = await sql.query("select name from tenants where slug = $1 limit 1", [slug]);
  return rows.length ? String(rows[0].name) : null;
}

export async function updateTenant(
  slug: string,
  updates: Record<string, unknown>,
): Promise<boolean> {
  const sql = client();
  const entries = Object.entries(updates).filter(([, v]) => v !== undefined);
  if (!entries.length) return true;

  const setCols: string[] = [];
  const vals: unknown[] = [];
  for (const [k, v] of entries) {
    vals.push(v);
    setCols.push(`${k} = $${vals.length}`);
  }
  vals.push(slug);

  const rows = await sql.query(
    `update tenants set ${setCols.join(", ")} where slug = $${entries.length + 1} returning id`,
    vals,
  );
  return rows.length > 0;
}

export async function tenantExists(slug: string): Promise<boolean> {
  const sql = client();
  const rows = await sql.query("select id from tenants where slug = $1 limit 1", [slug]);
  return rows.length > 0;
}

export async function getTenantByDomain(domain: string): Promise<string | null> {
  const sql = client();
  const rows = await sql.query(
    "select slug from tenants where primary_domain = $1 and status = 'active' limit 1",
    [domain],
  );
  return rows.length ? String(rows[0].slug) : null;
}

const TENANT_COLS = [
  "slug",
  "name",
  "primary_domain",
  "country",
  "city",
  "address",
  "description",
  "logo_url",
  "brand_color",
  "contact_email",
  "contact_phone",
  "whatsapp",
  "facebook",
  "instagram",
  "youtube",
  "service_schedule",
  "donation_info",
  "plan",
  "status",
];

export async function listTenants(): Promise<Tenant[]> {
  const sql = client();
  const rows = await sql.query("select * from tenants order by created_at desc");
  return (rows as Record<string, unknown>[]).map(toTenant);
}

export async function createTenant(input: Record<string, unknown>): Promise<Tenant> {
  const sql = client();
  const cols = TENANT_COLS;
  const vals = cols.map((c) => (input[c] === undefined ? null : input[c]));
  const placeholders = vals.map((_, i) => `$${i + 1}`);
  const rows = await sql.query(
    `insert into tenants (${cols.join(", ")})
     values (${placeholders.join(", ")}) returning *`,
    vals,
  );
  return toTenant(rows[0] as Record<string, unknown>);
}

// ----------------------------------------------------------------------------
// Decisiones de fe
// ----------------------------------------------------------------------------

function toDecision(row: Record<string, unknown>): SalvationDecision {
  return {
    id: String(row.id),
    tenant_id: row.tenant_id ? String(row.tenant_id) : null,
    full_name: String(row.full_name),
    email: row.email ? String(row.email) : null,
    phone: row.phone ? String(row.phone) : null,
    country: row.country ? String(row.country) : null,
    city: row.city ? String(row.city) : null,
    message: row.message ? String(row.message) : null,
    status: (row.status as SalvationDecision["status"]) ?? "nuevo",
    created_at: String(row.created_at),
  };
}

export async function createDecision(input: Record<string, unknown>): Promise<void> {
  const sql = client();
  await sql.query(
    `insert into salvation_decisions
       (tenant_id, full_name, email, phone, country, city, message, status)
     values ($1, $2, $3, $4, $5, $6, $7, 'nuevo')`,
    [
      input.tenant_id ?? "aguas-vivas",
      input.full_name,
      input.email ?? null,
      input.phone ?? null,
      input.country ?? null,
      input.city ?? null,
      input.message ?? null,
    ],
  );
}

export async function listDecisions(tenantId: string): Promise<SalvationDecision[]> {
  const sql = client();
  const rows = await sql.query(
    "select * from salvation_decisions where tenant_id = $1 order by created_at desc limit 300",
    [tenantId],
  );
  return (rows as Record<string, unknown>[]).map(toDecision);
}

// ----------------------------------------------------------------------------
// Cursos y lecciones
// ----------------------------------------------------------------------------

function toCourse(row: Record<string, unknown>): Course {
  return {
    id: String(row.id),
    slug: String(row.slug),
    level: Number(row.level),
    title: String(row.title),
    tagline: row.tagline ? String(row.tagline) : null,
    description: row.description ? String(row.description) : null,
    sort_order: Number(row.sort_order),
  };
}

function toLesson(row: Record<string, unknown>): Lesson {
  return {
    id: String(row.id),
    course_id: String(row.course_id),
    slug: String(row.slug),
    title: String(row.title),
    module_label: row.module_label ? String(row.module_label) : null,
    verse_ref: row.verse_ref ? String(row.verse_ref) : null,
    body: String(row.body),
    duration_min: row.duration_min != null ? Number(row.duration_min) : null,
    sort_order: Number(row.sort_order),
  };
}

export async function createCourse(input: Record<string, unknown>): Promise<Course> {
  const sql = client();
  const rows = await sql.query(
    `insert into courses (tenant_id, slug, level, title, tagline, description, sort_order)
     values ($1, $2, $3, $4, $5, $6, $7) returning *`,
    [
      input.tenant_id ?? "aguas-vivas",
      input.slug,
      input.level,
      input.title,
      input.tagline ?? null,
      input.description ?? null,
      input.sort_order ?? input.level,
    ],
  );
  return toCourse(rows[0] as Record<string, unknown>);
}

export async function updateCourse(
  id: string,
  tenantId: string,
  updates: Record<string, unknown>,
): Promise<Course | null> {
  const sql = client();
  const entries = Object.entries(updates).filter(
    ([k, v]) => v !== undefined && k !== "id",
  );
  if (!entries.length) return null;

  const setCols: string[] = [];
  const vals: unknown[] = [];
  for (const [k, v] of entries) {
    vals.push(v);
    setCols.push(`${k} = $${vals.length}`);
  }
  vals.push(tenantId, id);

  const rows = await sql.query(
    `update courses set ${setCols.join(", ")} where id = $${entries.length + 2} and tenant_id = $${entries.length + 1} returning *`,
    vals,
  );
  return rows.length ? toCourse(rows[0] as Record<string, unknown>) : null;
}

export async function deleteCourse(id: string, tenantId: string): Promise<boolean> {
  const sql = client();
  const rows = await sql.query(
    "delete from courses where id = $1 and tenant_id = $2 returning id",
    [id, tenantId],
  );
  return rows.length > 0;
}

export async function listCourses(tenantId: string): Promise<Course[]> {
  const sql = client();
  const rows = await sql.query(
    "select * from courses where tenant_id = $1 order by sort_order asc",
    [tenantId],
  );
  return (rows as Record<string, unknown>[]).map(toCourse);
}

export async function getCourseBySlug(tenantId: string, slug: string): Promise<Course | null> {
  const sql = client();
  const rows = await sql.query(
    "select * from courses where tenant_id = $1 and slug = $2 limit 1",
    [tenantId, slug],
  );
  return rows.length ? toCourse(rows[0] as Record<string, unknown>) : null;
}

export async function createLesson(input: Record<string, unknown>): Promise<Lesson> {
  const sql = client();
  const rows = await sql.query(
    `insert into lessons
       (course_id, slug, title, module_label, verse_ref, body, duration_min, sort_order)
     values ($1, $2, $3, $4, $5, $6, $7, $8) returning *`,
    [
      input.course_id,
      input.slug,
      input.title,
      input.module_label ?? null,
      input.verse_ref ?? null,
      input.body,
      input.duration_min ?? 15,
      input.sort_order ?? 1,
    ],
  );
  return toLesson(rows[0] as Record<string, unknown>);
}

export async function updateLesson(
  id: string,
  tenantId: string,
  updates: Record<string, unknown>,
): Promise<Lesson | null> {
  const sql = client();
  const entries = Object.entries(updates).filter(
    ([k, v]) => v !== undefined && k !== "id",
  );
  if (!entries.length) return null;

  const setCols: string[] = [];
  const vals: unknown[] = [];
  for (const [k, v] of entries) {
    vals.push(v);
    setCols.push(`${k} = $${vals.length}`);
  }
  vals.push(tenantId, id);

  const rows = await sql.query(
    `update lessons l set ${setCols.join(", ")}
     where l.id = $${entries.length + 2}
       and l.course_id in (select id from courses where tenant_id = $${entries.length + 1})
     returning l.*`,
    vals,
  );
  return rows.length ? toLesson(rows[0] as Record<string, unknown>) : null;
}

export async function deleteLesson(id: string, tenantId: string): Promise<boolean> {
  const sql = client();
  const rows = await sql.query(
    `delete from lessons l
     where l.id = $1
       and l.course_id in (select id from courses where tenant_id = $2)
     returning l.id`,
    [id, tenantId],
  );
  return rows.length > 0;
}

export async function listLessonsForCourseIds(courseIds: string[]): Promise<Lesson[]> {
  const sql = client();
  if (!courseIds.length) return [];
  const placeholders = courseIds.map((_, i) => `$${i + 1}`);
  const rows = await sql.query(
    `select * from lessons where course_id in (${placeholders.join(", ")})
     order by sort_order asc`,
    courseIds,
  );
  return (rows as Record<string, unknown>[]).map(toLesson);
}

export async function listLessonsByCourseSlug(tenantId: string, slug: string): Promise<Lesson[]> {
  const sql = client();
  const rows = await sql.query(
    `select l.* from lessons l
     join courses c on c.id = l.course_id
     where c.tenant_id = $1 and c.slug = $2
     order by l.sort_order asc`,
    [tenantId, slug],
  );
  return (rows as Record<string, unknown>[]).map(toLesson);
}

export async function copyCoursesToTenant(
  sourceTenantSlug: string,
  targetTenantSlug: string,
): Promise<number> {
  const sourceCourses = await listCourses(sourceTenantSlug);
  const sourceIds = sourceCourses.map((c) => c.id);
  const lessons = await listLessonsForCourseIds(sourceIds);

  let copied = 0;
  for (const course of sourceCourses) {
    const courseLessons = lessons.filter((l) => l.course_id === course.id);
    const created = await createCourse({
      tenant_id: targetTenantSlug,
      slug: course.slug,
      level: course.level,
      title: course.title,
      tagline: course.tagline,
      description: course.description,
      sort_order: course.sort_order,
    });
    copied += 1;
    for (const l of courseLessons) {
      await createLesson({
        course_id: created.id,
        slug: l.slug,
        title: l.title,
        module_label: l.module_label,
        verse_ref: l.verse_ref,
        body: l.body,
        duration_min: l.duration_min,
        sort_order: l.sort_order,
      });
      copied += 1;
    }
  }
  return copied;
}

// ----------------------------------------------------------------------------
// Progreso de lecciones (user_ref: 'admin' para la clave maestra,
// o el id de un miembro)
// ----------------------------------------------------------------------------

export async function setLessonProgress(lessonId: string, userRef = "admin"): Promise<void> {
  const sql = client();
  await sql.query(
    `insert into lesson_progress (user_ref, lesson_id)
     values ($1, $2)
     on conflict (user_ref, lesson_id) do nothing`,
    [userRef, lessonId],
  );
}

export async function unsetLessonProgress(lessonId: string, userRef = "admin"): Promise<void> {
  const sql = client();
  await sql.query(
    "delete from lesson_progress where user_ref = $1 and lesson_id = $2",
    [userRef, lessonId],
  );
}

export async function completedLessonIds(userRef: string): Promise<string[]> {
  const sql = client();
  const rows = await sql.query(
    "select lesson_id from lesson_progress where user_ref = $1",
    [userRef],
  );
  return (rows as Record<string, unknown>[]).map((r) => String(r.lesson_id));
}

export async function countTenantLessons(tenantId: string): Promise<number> {
  const sql = client();
  const rows = await sql.query(
    `select count(l.id) as total
     from courses c
     join lessons l on l.course_id = c.id
     where c.tenant_id = $1`,
    [tenantId],
  );
  return rows.length ? Number(rows[0].total) : 0;
}

export async function isLessonDone(lessonId: string, userRef: string): Promise<boolean> {
  const sql = client();
  const rows = await sql.query(
    "select 1 from lesson_progress where user_ref = $1 and lesson_id = $2 limit 1",
    [userRef, lessonId],
  );
  return rows.length > 0;
}

// ----------------------------------------------------------------------------
// Miembros
// ----------------------------------------------------------------------------

function toMember(row: Record<string, unknown>): Member {
  return {
    id: String(row.id),
    tenant_id: String(row.tenant_id ?? "aguas-vivas"),
    email: String(row.email),
    full_name: String(row.full_name),
    role: (row.role as Member["role"]) ?? "miembro",
    status: (row.status as Member["status"]) ?? "active",
    level: Number(row.level ?? 1),
    created_at: String(row.created_at),
    updated_at: String(row.updated_at),
  };
}

export async function createMember(input: Record<string, unknown>): Promise<Member> {
  const sql = client();
  const rows = await sql.query(
    `insert into members (tenant_id, email, password_hash, full_name, role, status, level)
     values ($1, $2, $3, $4, $5, $6, $7) returning *`,
    [
      input.tenant_id ?? "aguas-vivas",
      String(input.email ?? "").toLowerCase().trim(),
      input.password_hash,
      input.full_name ?? "",
      input.role ?? "miembro",
      input.status ?? "active",
      input.level ?? 1,
    ],
  );
  return toMember(rows[0] as Record<string, unknown>);
}

export async function findMemberByEmail(tenantId: string, email: string): Promise<Member | null> {
  const sql = client();
  const rows = await sql.query(
    "select * from members where tenant_id = $1 and lower(email) = lower($2) limit 1",
    [tenantId, String(email).trim()],
  );
  return rows.length ? toMember(rows[0] as Record<string, unknown>) : null;
}

export async function getMember(id: string): Promise<Member | null> {
  const sql = client();
  const rows = await sql.query("select * from members where id = $1 limit 1", [id]);
  return rows.length ? toMember(rows[0] as Record<string, unknown>) : null;
}

export async function getMemberPasswordHash(id: string): Promise<string | null> {
  const sql = client();
  const rows = await sql.query(
    "select password_hash from members where id = $1 limit 1",
    [id],
  );
  return rows.length ? String(rows[0].password_hash) : null;
}

export async function listMembers(tenantId: string): Promise<Member[]> {
  const sql = client();
  const rows = await sql.query(
    "select * from members where tenant_id = $1 order by full_name asc",
    [tenantId],
  );
  return (rows as Record<string, unknown>[]).map(toMember);
}

export async function updateMember(
  id: string,
  updates: Record<string, unknown>,
): Promise<Member | null> {
  const sql = client();
  const entries = Object.entries(updates).filter(
    ([k, v]) => v !== undefined && k !== "id" && k !== "email",
  );
  if (!entries.length) return getMember(id);

  entries.push(["updated_at", new Date().toISOString()]);
  const setCols: string[] = [];
  const vals: unknown[] = [];
  for (const [k, v] of entries) {
    vals.push(v);
    setCols.push(`${k} = $${vals.length}`);
  }
  vals.push(id);

  const rows = await sql.query(
    `update members set ${setCols.join(", ")} where id = $${vals.length} returning *`,
    vals,
  );
  return rows.length ? toMember(rows[0] as Record<string, unknown>) : null;
}

// ----------------------------------------------------------------------------
// Sesiones de miembro
// ----------------------------------------------------------------------------

export async function createMemberSession(
  memberId: string,
  expiresAt: string,
): Promise<string> {
  const sql = client();
  const token = (
    process.env.MEMBER_SESSION_SECRET ?? "av-members"
  ) + "-" + randomBytes(48).toString("hex");
  await sql.query(
    "insert into member_sessions (token, member_id, expires_at) values ($1, $2, $3)",
    [token, memberId, expiresAt],
  );
  return token;
}

export async function getMemberBySession(token: string): Promise<Member | null> {
  const sql = client();
  const rows = await sql.query(
    `select m.*
     from member_sessions s
     join members m on m.id = s.member_id
     where s.token = $1 and s.expires_at > now() and m.status = 'active'
     limit 1`,
    [token],
  );
  return rows.length ? toMember(rows[0] as Record<string, unknown>) : null;
}

export async function deleteMemberSession(token: string): Promise<void> {
  const sql = client();
  await sql.query("delete from member_sessions where token = $1", [token]);
}

export async function revokeMemberSessions(memberId: string): Promise<void> {
  const sql = client();
  await sql.query("delete from member_sessions where member_id = $1", [memberId]);
}

// ----------------------------------------------------------------------------
// Recuperación de clave por correo
// ----------------------------------------------------------------------------

export async function createPasswordReset(
  memberId: string,
  token: string,
  expiresAt: string,
): Promise<void> {
  const sql = client();
  await sql.query(
    "insert into password_resets (token, member_id, expires_at) values ($1, $2, $3)",
    [token, memberId, expiresAt],
  );
}

export async function getPasswordReset(token: string): Promise<string | null> {
  const sql = client();
  const rows = await sql.query(
    `select member_id from password_resets
     where token = $1 and expires_at > now() limit 1`,
    [token],
  );
  return rows.length ? String(rows[0].member_id) : null;
}

export async function consumePasswordReset(token: string): Promise<void> {
  const sql = client();
  await sql.query("delete from password_resets where token = $1", [token]);
}

// ----------------------------------------------------------------------------
// Niveles: desbloqueo automático por progreso
// ----------------------------------------------------------------------------

export async function syncMemberLevel(memberId: string, tenantId: string): Promise<number> {
  const sql = client();
  const member = await getMember(memberId);
  if (!member) return 0;

  const totals = await sql.query(
    `select c.level, count(l.id) as total
     from courses c
     join lessons l on l.course_id = c.id
     where c.tenant_id = $1
     group by c.level`,
    [tenantId],
  );
  if (!totals.length) return member.level;

  const done = await sql.query(
    `select c.level, count(lp.lesson_id) as done
     from courses c
     join lessons l on l.course_id = c.id
     join lesson_progress lp on lp.lesson_id = l.id and lp.user_ref = $1
     where c.tenant_id = $2
     group by c.level`,
    [memberId, tenantId],
  );

  const totalBy = new Map<number, number>();
  for (const r of totals) totalBy.set(Number(r.level), Number(r.total));
  const doneBy = new Map<number, number>();
  for (const r of done) doneBy.set(Number(r.level), Number(r.done));

  const levels = [...totalBy.keys()].sort((a, b) => a - b);
  let unlocked = member.level;
  for (const lv of levels) {
    const total = totalBy.get(lv) ?? 0;
    const d = doneBy.get(lv) ?? 0;
    if (d >= total) unlocked = lv + 1;
    else break;
  }

  const next = Math.max(member.level, unlocked);
  if (next !== member.level) {
    await sql.query("update members set level = $1, updated_at = now() where id = $2", [next, memberId]);
  }
  return next;
}

// ----------------------------------------------------------------------------
// Mayordomía (transacciones)
// ----------------------------------------------------------------------------

function toTransaction(row: Record<string, unknown>): Transaction {
  return {
    id: String(row.id),
    tenant_id: row.tenant_id ? String(row.tenant_id) : null,
    kind: (row.kind as Transaction["kind"]) ?? "ingreso",
    category: String(row.category ?? "ofrenda"),
    amount: row.amount != null ? Number(row.amount) : 0,
    currency: String(row.currency ?? "PEN"),
    description: row.description ? String(row.description) : null,
    occurred_at: String(row.occurred_at),
    donor_name: row.donor_name ? String(row.donor_name) : null,
    donor_email: row.donor_email ? String(row.donor_email) : null,
    donor_phone: row.donor_phone ? String(row.donor_phone) : null,
    method: row.method ? String(row.method) : null,
    requested_by_name: row.requested_by_name ? String(row.requested_by_name) : null,
    approval_status: row.approval_status as Transaction["approval_status"],
    approved_by_name: row.approved_by_name ? String(row.approved_by_name) : null,
    approved_at: row.approved_at ? String(row.approved_at) : null,
    status: String(row.status ?? "confirmado"),
    receipt_code: row.receipt_code ? String(row.receipt_code) : null,
  };
}

export async function createTransaction(
  insert: Record<string, unknown>,
): Promise<Transaction> {
  const sql = client();
  const allowed = [
    "tenant_id",
    "kind",
    "category",
    "amount",
    "currency",
    "description",
    "occurred_at",
    "donor_name",
    "donor_email",
    "donor_phone",
    "method",
    "requested_by_name",
    "approval_status",
    "approved_by_name",
    "approved_at",
    "status",
    "receipt_code",
  ];
  const cols = allowed.filter((c) => insert[c] !== undefined);
  const vals = cols.map((c) => insert[c]);
  const placeholders = vals.map((_, i) => `$${i + 1}`);

  const rows = await sql.query(
    `insert into transactions (${cols.join(", ")})
     values (${placeholders.join(", ")})
     returning *`,
    vals,
  );
  return toTransaction(rows[0] as Record<string, unknown>);
}

export async function getTransaction(id: string, tenantId?: string): Promise<Transaction | null> {
  const sql = client();
  const rows = tenantId
    ? await sql.query("select * from transactions where id = $1 and tenant_id = $2 limit 1", [id, tenantId])
    : await sql.query("select * from transactions where id = $1 limit 1", [id]);
  return rows.length ? toTransaction(rows[0] as Record<string, unknown>) : null;
}

export async function updateTransaction(
  id: string,
  tenantId: string,
  updates: Record<string, unknown>,
): Promise<Transaction | null> {
  const sql = client();
  const entries = Object.entries(updates).filter(
    ([k, v]) => v !== undefined && k !== "id",
  );
  if (!entries.length) return getTransaction(id, tenantId);

  const setCols: string[] = [];
  const vals: unknown[] = [];
  for (const [k, v] of entries) {
    vals.push(v);
    setCols.push(`${k} = $${vals.length}`);
  }
  vals.push(tenantId, id);

  const rows = await sql.query(
    `update transactions set ${setCols.join(", ")} where id = $${entries.length + 2} and tenant_id = $${entries.length + 1} returning *`,
    vals,
  );
  return rows.length ? toTransaction(rows[0] as Record<string, unknown>) : null;
}

export async function deleteTransaction(id: string, tenantId: string): Promise<boolean> {
  const sql = client();
  const rows = await sql.query(
    "delete from transactions where id = $1 and tenant_id = $2 returning id",
    [id, tenantId],
  );
  return rows.length > 0;
}

export async function listTransactions(
  tenantId: string,
  startISO: string,
  endISO: string,
): Promise<Transaction[]> {
  const sql = client();
  const rows = await sql.query(
    `select * from transactions
     where tenant_id = $1 and occurred_at >= $2 and occurred_at < $3
     order by occurred_at desc
     limit 300`,
    [tenantId, startISO, endISO],
  );
  return (rows as Record<string, unknown>[]).map(toTransaction);
}
