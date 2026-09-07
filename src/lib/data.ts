import type { Tenant } from "./types";
import type { Course, Lesson } from "./lesson";
import { DEMO_TENANT, DEMO_COURSE, DEMO_LESSONS, DEMO_RECORDINGS } from "./demo-data";
import type { Session } from "./types";
import { DEFAULT_TENANT_SLUG } from "./constants";

export function isDemoMode(): boolean {
  return !process.env.DATABASE_URL;
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
}

export async function getLessonPage(
  tenantSlug: string,
  courseSlug: string,
  lessonSlug: string,
): Promise<LessonPageData | null> {
  const course = await getCourse(tenantSlug, courseSlug);
  if (!course) return null;

  const lessons = await getLessonsForCourse(tenantSlug, courseSlug);
  const index = lessons.findIndex((l) => l.slug === lessonSlug);
  if (index === -1) return null;

  return {
    course,
    lesson: lessons[index],
    prev: lessons[index - 1] ?? null,
    next: lessons[index + 1] ?? null,
    lessons,
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