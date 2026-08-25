import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { DEFAULT_TENANT_SLUG } from "@/lib/constants";
import type { Profile } from "@/lib/types";
import type { Course, Lesson } from "@/lib/lesson";
import AdminShell from "@/components/AdminShell";
import CoursesManager from "@/components/CoursesManager";

export const metadata = {
  title: "Niveles de estudio",
};

export default async function AdminEstudiosPage() {
  const supabase = await createClient();

  let user = null;
  try {
    const {
      data: { user: u },
    } = await supabase.auth.getUser();
    user = u;
  } catch {
    user = null;
  }

  if (!user) redirect("/acceso");

  let profile: Profile | null = null;
  try {
    const { data } = await supabase
      .from("profiles")
      .select("id, tenant_id, full_name, role")
      .eq("id", user.id)
      .maybeSingle();
    profile = (data as Profile) ?? null;
  } catch {
    profile = null;
  }

  const canEdit = !!profile && ["super_admin", "pastor", "maestro"].includes(profile.role);

  let courses: Course[] = [];
  let lessonsByCourse: Record<string, Lesson[]> = {};
  let tenantName: string | undefined;

  if (canEdit) {
    try {
      const { data: tenant } = await supabase
        .from("tenants")
        .select("id, name")
        .eq("slug", DEFAULT_TENANT_SLUG)
        .maybeSingle();

      if (tenant) {
        tenantName = tenant.name;
        const { data: coursesData } = await supabase
          .from("courses")
          .select("id, slug, level, title, tagline, description, sort_order")
          .eq("tenant_id", tenant.id)
          .order("sort_order", { ascending: true });

        courses = (coursesData as Course[]) ?? [];

        if (courses.length) {
          const { data: lessonsData } = await supabase
            .from("lessons")
            .select(
              "id, course_id, slug, title, module_label, verse_ref, body, duration_min, sort_order",
            )
            .in(
              "course_id",
              courses.map((c) => c.id),
            )
            .order("sort_order", { ascending: true });

          for (const row of lessonsData ?? []) {
            const cid = row.course_id as string;
            (lessonsByCourse[cid] ??= []).push(row as unknown as Lesson);
          }
        }
      }
    } catch {}
  }

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

      {!canEdit && (
        <div className="perm-note">
          <span>🔒</span>
          <div>
            <b>Sin permisos de edición</b>
            Solo pastores, maestros y super administradores pueden gestionar
            los niveles de estudio.
          </div>
        </div>
      )}

      {canEdit && (
        <CoursesManager courses={courses} lessonsByCourse={lessonsByCourse} />
      )}
    </AdminShell>
  );
}
