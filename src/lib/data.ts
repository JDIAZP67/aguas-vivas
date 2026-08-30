import type { Tenant } from "./types";
import type { Course, Lesson } from "./lesson";
import { DEMO_TENANT, DEMO_COURSE, DEMO_LESSONS, DEMO_RECORDINGS } from "./demo-data";
import type { Session } from "./types";

export function isDemoMode(): boolean {
  return !process.env.NEXT_PUBLIC_SUPABASE_URL;
}

export async function getTenant(): Promise<Tenant | null> {
  if (isDemoMode()) return DEMO_TENANT;

  try {
    const { createClient } = await import("@/lib/supabase/server");
    const supabase = await createClient();
    const { data } = await supabase
      .from("tenants")
      .select("*")
      .eq("slug", "aguas-vivas")
      .maybeSingle();
    return (data as Tenant) ?? DEMO_TENANT;
  } catch {
    return DEMO_TENANT;
  }
}

export async function getCourses(): Promise<Course[]> {
  return [DEMO_COURSE];
}

export async function getLessonsForCourse(slug: string): Promise<Lesson[]> {
  return slug === DEMO_COURSE.slug ? DEMO_LESSONS : [];
}

export async function getCourse(slug: string): Promise<Course | null> {
  const courses = await getCourses();
  return courses.find((c) => c.slug === slug) ?? null;
}

export interface LessonPageData {
  course: Course;
  lesson: Lesson;
  prev: Lesson | null;
  next: Lesson | null;
  lessons: Lesson[];
}

export async function getLessonPage(
  courseSlug: string,
  lessonSlug: string,
): Promise<LessonPageData | null> {
  const course = await getCourse(courseSlug);
  if (!course) return null;

  const lessons = await getLessonsForCourse(courseSlug);
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

export async function getRecordings(): Promise<Session[]> {
  const { hasDatabase } = await import("@/lib/db");
  if (!hasDatabase()) return DEMO_RECORDINGS;

  try {
    const { listSessions } = await import("@/lib/db");
    const all = await listSessions("finalizada");
    return all.slice(0, 30);
  } catch {
    return DEMO_RECORDINGS;
  }
}
