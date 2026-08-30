import { neon } from "@neondatabase/serverless";
import type { Session } from "./types";

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
  input: Record<string, unknown>,
): Promise<Session | null> {
  const sql = client();
  const entries = Object.entries(input).filter(
    ([k, v]) => v !== undefined && k !== "id",
  );

  if (entries.length === 0) {
    const r = await sql.query("select * from sessions where id = $1", [id]);
    return r.length ? toSession(r[0] as Record<string, unknown>) : null;
  }

  const setCols: string[] = [];
  const vals: unknown[] = [];
  for (const [k, v] of entries) {
    vals.push(v);
    setCols.push(`${k} = $${vals.length}`);
  }
  vals.push(id);

  const rows = await sql.query(
    `update sessions set ${setCols.join(", ")} where id = $${entries.length + 1} returning *`,
    vals,
  );
  return rows.length ? toSession(rows[0] as Record<string, unknown>) : null;
}

export async function deleteSession(id: string): Promise<boolean> {
  const sql = client();
  const rows = await sql.query(
    "delete from sessions where id = $1 returning id",
    [id],
  );
  return rows.length > 0;
}

export async function listSessions(status?: string): Promise<Session[]> {
  const sql = client();
  const rows = status
    ? await sql.query(
        "select * from sessions where status = $1 order by starts_at desc",
        [status],
      )
    : await sql.query("select * from sessions order by starts_at desc");
  return (rows as unknown as Record<string, unknown>[]).map(toSession);
}
