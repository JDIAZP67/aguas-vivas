import type { Tenant } from "./types";
import type { Course, Lesson } from "./lesson";
import { DEMO_TENANT, DEMO_COURSE, DEMO_LESSONS, DEMO_RECORDINGS } from "./demo-data";
import type { Session } from "./types";
import { DEFAULT_TENANT_SLUG } from "./constants";

export function isDemoMode(): boolean {
  return !process.env.DATABASE_URL;
}

export interface LevelProgress {
  level: number;
  courseSlug: string;
  title: string;
  total: number;
  done: number;
  locked: boolean;
}

export async function getMemberLevelsProgress(
  tenantSlug: string,
  userRef: string,
  memberLevel: number,
): Promise<LevelProgress[]> {
  const courses = await getCourses(tenantSlug);
  const completed = new Set<string>();
  try {
    const db = await import("@/lib/db");
    for (const id of await db.completedLessonIds(userRef)) completed.add(String(id));
  } catch {
    // progreso vacío
  }

  const out: LevelProgress[] = [];
  for (const c of courses) {
    const lessons = await getLessonsForCourse(tenantSlug, c.slug);
    let done = 0;
    for (const l of lessons) if (completed.has(String(l.id))) done += 1;
    out.push({
      level: c.level,
      courseSlug: c.slug,
      title: c.title,
      total: lessons.length,
      done,
      locked: c.level > memberLevel,
    });
  }
  return out.sort((a, b) => a.level - b.level);
}

export async function getTenant(slug = DEFAULT_TENANT_SLUG): Promise<Tenant | null> {
  if (isDemoMode()) return DEMO_TENANT;

  try {
    const { getTenantRow } = await import("@/lib/db");
    return (await getTenantRow(slug)) ?? DEMO_TENANT;
  } catch {
    return DEMO_TENANT;
  }
}

export async function getCourses(slug = DEFAULT_TENANT_SLUG): Promise<Course[]> {
  if (isDemoMode()) return [DEMO_COURSE];

  try {
    const { listCourses } = await import("@/lib/db");
    return await listCourses(slug);
  } catch {
    return [DEMO_COURSE];
  }
}

export async function getLessonsForCourse(tenantSlug: string, slug: string): Promise<Lesson[]> {
  if (isDemoMode()) return slug === DEMO_COURSE.slug ? DEMO_LESSONS : [];

  try {
    const { listLessonsByCourseSlug } = await import("@/lib/db");
    return await listLessonsByCourseSlug(tenantSlug, slug);
  } catch {
    return [];
  }
}

export async function getCourse(tenantSlug: string, slug: string): Promise<Course | null> {
  if (isDemoMode()) return slug === DEMO_COURSE.slug ? DEMO_COURSE : null;

  try {
    const { getCourseBySlug } = await import("@/lib/db");
    return await getCourseBySlug(tenantSlug, slug);
  } catch {
    return null;
  }
}

export interface LessonPageData {
  course: Course;
  lesson: Lesson;
  prev: Lesson | null;
  next: Lesson | null;
  lessons: Lesson[];
  userRef?: string;
  done: boolean;
}

export async function getLessonPage(
  tenantSlug: string,
  courseSlug: string,
  lessonSlug: string,
  userRef?: string,
): Promise<LessonPageData | null> {
  const course = await getCourse(tenantSlug, courseSlug);
  if (!course) return null;

  const lessons = await getLessonsForCourse(tenantSlug, courseSlug);
  const index = lessons.findIndex((l) => l.slug === lessonSlug);
  if (index === -1) return null;

  const lesson = lessons[index];
  let done = false;
  if (userRef) {
    try {
      const db = await import("@/lib/db");
      done = await db.isLessonDone(lesson.id, userRef);
    } catch {
      done = false;
    }
  }

  return {
    course,
    lesson,
    prev: lessons[index - 1] ?? null,
    next: lessons[index + 1] ?? null,
    lessons,
    userRef,
    done,
  };
}

export async function getRecordings(slug = DEFAULT_TENANT_SLUG): Promise<Session[]> {
  const { hasDatabase } = await import("@/lib/db");
  if (!hasDatabase()) return DEMO_RECORDINGS;

  try {
    const { listSessions } = await import("@/lib/db");
    const all = await listSessions(slug, "finalizada");
    return all.slice(0, 30);
  } catch {
    return DEMO_RECORDINGS;
  }
}