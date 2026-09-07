import { redirect } from "next/navigation";
import { getDemoProfile } from "@/lib/demo-auth";
import { getAdminProfile } from "@/lib/auth";
import { getAdminTenantSlug, getTenantNameBySlug } from "@/lib/tenant";
import { roleAllows } from "@/lib/roles";
import { DEMO_COURSE, DEMO_LESSONS } from "@/lib/demo-data";
import type { Profile } from "@/lib/types";
import type { Course, Lesson } from "@/lib/lesson";
import AdminShell from "@/components/AdminShell";
import CoursesManager from "@/components/CoursesManager";

export const metadata = {
  title: "Niveles de estudio",
};

export default async function AdminEstudiosPage() {
  const { hasAuthConfigured } = await import("@/lib/auth");
  const realProfile = await getAdminProfile();
  const useReal = hasAuthConfigured();
  const demoProfile = useReal ? null : await getDemoProfile();
  const demo = !useReal && demoProfile !== null;

  if (useReal && !realProfile) redirect("/acceso");
  if (!useReal && !demoProfile) redirect("/acceso");
  if (realProfile && !roleAllows(realProfile.role, "estudios")) redirect("/admin");

  let courses: Course[] = [];
  let lessonsByCourse: Record<string, Lesson[]> = {};
  let tenantName: string | undefined;
  let profile: Profile | null = null;

  if (realProfile) {
    profile = realProfile;
    tenantName = await getTenantNameBySlug(await getAdminTenantSlug());
    try {
      const { listCourses, listLessonsForCourseIds } = await import("@/lib/db");
      const slug = await getAdminTenantSlug();
      courses = await listCourses(slug);
      const lessons = await listLessonsForCourseIds(courses.map((c) => c.id));
      for (const l of lessons) {
        (lessonsByCourse[l.course_id] ??= []).push(l);
      }
    } catch {}
  }

  if (demo) {
    profile = demoProfile;
    tenantName = "Aguas Vivas (Demo)";
    courses = [DEMO_COURSE];
    lessonsByCourse = { [DEMO_COURSE.id]: DEMO_LESSONS };
  }

  const canEdit = Boolean(profile);

  return (
    <AdminShell active="/admin/estudios" profile={profile} tenantName={tenantName}>
      <div className="page-head">
        <div>
          <div className="page-eyebrow">Formación bíblica</div>
          <h1>Niveles de estudio</h1>
        </div>
        {courses.length > 0 && (
          <span className="save-note">
            {courses.length} nivel{courses.length !== 1 && "es"}
          </span>
        )}
      </div>
      <p className="subhead">
        Crea y edita los niveles de discipulado. Agrega lecciones con contenido
        bíblico para que tus estudiantes avancen.
      </p>

      {demo && (
        <div className="perm-note" style={{ marginBottom: 24 }}>
          <span>🧪</span>
          <div>
            <b>Modo demostración</b>
            Estás viendo el panel con datos de ejemplo. Cuando conectes tu base
            de datos (DATABASE_URL), aquí cargarás tus niveles reales.
          </div>
        </div>
      )}

      {canEdit && (
        <CoursesManager courses={courses} lessonsByCourse={lessonsByCourse} />
      )}
    </AdminShell>
  );
}