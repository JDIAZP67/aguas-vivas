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
  if (isDemoMode()) return [DEMO_COURSE];

  try {
    const { createClient } = await import("@/lib/supabase/server");
    const supabase = await createClient();
    const { data: tenant } = await supabase
      .from("tenants")
      .select("id")
      .eq("slug", "aguas-vivas")
      .maybeSingle();
    if (!tenant) return [DEMO_COURSE];

    const { data } = await supabase
      .from("courses")
      .select("id, slug, level, title, tagline, description, sort_order")
      .eq("tenant_id", tenant.id)
      .order("level", { ascending: true });
    return (data as Course[])?.length ? (data as Course[]) : [DEMO_COURSE];
  } catch {
    return [DEMO_COURSE];
  }
}

export async function getLessonsForCourse(slug: string): Promise<Lesson[]> {
  if (isDemoMode()) {
    return slug === DEMO_COURSE.slug ? DEMO_LESSONS : [];
  }

  try {
    const { createClient } = await import("@/lib/supabase/server");
    const supabase = await createClient();
    const { data: tenant } = await supabase
      .from("tenants")
      .select("id")
      .eq("slug", "aguas-vivas")
      .maybeSingle();
    if (!tenant) return [];

    const { data: c } = await supabase
      .from("courses")
      .select("id")
      .eq("tenant_id", tenant.id)
      .eq("slug", slug)
      .maybeSingle();
    if (!c) return slug === DEMO_COURSE.slug ? DEMO_LESSONS : [];

    const { data } = await supabase
      .from("lessons")
      .select(
        "id, course_id, slug, title, module_label, verse_ref, body, duration_min, sort_order",
      )
      .eq("course_id", c.id)
      .order("sort_order", { ascending: true });
    return (data as Lesson[])?.length ? (data as Lesson[]) : [];
  } catch {
    return slug === DEMO_COURSE.slug ? DEMO_LESSONS : [];
  }
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
