"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import type { Course, Lesson } from "@/lib/lesson";

interface Props {
  courses: Course[];
  lessonsByCourse: Record<string, Lesson[]>;
}

interface CourseForm {
  id: string | null;
  title: string;
  level: string;
  slug: string;
  tagline: string;
  description: string;
  sort_order: string;
}

interface LessonForm {
  id: string | null;
  course_id: string;
  title: string;
  slug: string;
  module_label: string;
  verse_ref: string;
  body: string;
  duration_min: string;
  sort_order: string;
}

const EMPTY_COURSE: CourseForm = {
  id: null,
  title: "",
  level: "",
  slug: "",
  tagline: "",
  description: "",
  sort_order: "",
};

const EMPTY_LESSON: LessonForm = {
  id: null,
  course_id: "",
  title: "",
  slug: "",
  module_label: "",
  verse_ref: "",
  body: "",
  duration_min: "15",
  sort_order: "",
};

const inputStyle = {
  fontFamily: "var(--font-body)",
  fontSize: "0.88rem",
  padding: "10px 13px",
  border: "1px solid var(--line)",
  borderRadius: 10,
  background: "var(--foam)",
  color: "var(--ink)",
  width: "100%",
} as const;

function sortOf(formSort: string, fallback: number): number {
  const n = Number(formSort);
  return n > 0 ? n : fallback;
}

export default function CoursesManager({ courses: initial, lessonsByCourse }: Props) {
  const router = useRouter();
  const [courses, setCourses] = useState<Course[]>(initial);
  const [courseForm, setCourseForm] = useState<CourseForm>(EMPTY_COURSE);
  const [lessonForm, setLessonForm] = useState<LessonForm>(EMPTY_LESSON);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ type: "ok" | "err"; text: string } | null>(null);

  function lessons(cid: string): Lesson[] {
    return lessonsByCourse[cid] ?? [];
  }

  function update(
    setter: typeof setCourses,
    list: Course[],
    updated: Course,
  ) {
    return list.map((c) => (c.id === updated.id ? updated : c));
  }

  async function apiCall(
    method: "POST" | "PUT" | "DELETE",
    endpoint: string,
    body: Record<string, unknown>,
    successMsg: string,
  ) {
    if (busy) return false;
    setBusy(true);
    setMsg(null);
    try {
      const res = await fetch(endpoint, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!data.ok) {
        setMsg({ type: "err", text: data.error ?? "Error desconocido." });
        return false;
      }
      setMsg({ type: "ok", text: successMsg });
      return true;
    } catch {
      setMsg({ type: "err", text: "No se pudo conectar con el servidor." });
      return false;
    } finally {
      setBusy(false);
    }
  }

  function resetCourseForm() {
    setCourseForm(EMPTY_COURSE);
    setMsg(null);
  }

  function resetLessonForm() {
    setLessonForm(EMPTY_LESSON);
    setMsg(null);
  }

  function editCourse(c: Course) {
    setMsg(null);
    setLessonForm(EMPTY_LESSON);
    setCourseForm({
      id: c.id,
      title: c.title,
      level: String(c.level),
      slug: c.slug,
      tagline: c.tagline ?? "",
      description: c.description ?? "",
      sort_order: String(c.sort_order),
    });
  }

  function editLesson(l: Lesson) {
    setMsg(null);
    setCourseForm(EMPTY_COURSE);
    setLessonForm({
      id: l.id,
      course_id: l.course_id,
      title: l.title,
      slug: l.slug,
      module_label: l.module_label ?? "",
      verse_ref: l.verse_ref ?? "",
      body: l.body,
      duration_min: String(l.duration_min ?? 15),
      sort_order: String(l.sort_order),
    });
  }

  async function handleCourseSubmit(e: FormEvent) {
    e.preventDefault();
    const isEdit = !!courseForm.id;
    const payload: Record<string, unknown> = {
      title: courseForm.title,
      level: Number(courseForm.level),
      slug: courseForm.slug || courseForm.title,
      tagline: courseForm.tagline,
      description: courseForm.description,
      sort_order: sortOf(courseForm.sort_order, Number(courseForm.level) || courses.length + 1),
    };
    if (isEdit) payload.id = courseForm.id;

    const ok = await apiCall(
      isEdit ? "PUT" : "POST",
      "/api/courses",
      payload,
      isEdit ? "Curso actualizado." : "Curso creado.",
    );
    if (ok) {
      resetCourseForm();
      router.refresh();
    }
  }

  async function deleteCourse(c: Course) {
    if (!confirm(`¿Eliminar "${c.title}" y todas sus lecciones (${lessons(c.id).length})?`)) return;
    const ok = await apiCall("DELETE", "/api/courses", { id: c.id }, "Curso eliminado.");
    if (ok) {
      if (expanded === c.id) setExpanded(null);
      setCourses((prev) => prev.filter((x) => x.id !== c.id));
      router.refresh();
    }
  }

  function startLesson(cid: string) {
    resetLessonForm();
    setLessonForm((prev) => ({ ...prev, course_id: cid }));
  }

  async function handleLessonSubmit(e: FormEvent) {
    e.preventDefault();
    const isEdit = !!lessonForm.id;
    const payload: Record<string, unknown> = {
      course_id: lessonForm.course_id,
      title: lessonForm.title,
      slug: lessonForm.slug || lessonForm.title,
      module_label: lessonForm.module_label,
      verse_ref: lessonForm.verse_ref,
      body: lessonForm.body,
      duration_min: Number(lessonForm.duration_min) || 15,
      sort_order: sortOf(
        lessonForm.sort_order,
        (lessonsByCourse[lessonForm.course_id]?.length ?? 0) + 1,
      ),
    };
    if (isEdit) payload.id = lessonForm.id;

    const ok = await apiCall(
      isEdit ? "PUT" : "POST",
      "/api/lessons",
      payload,
      isEdit ? "Lección actualizada." : "Lección creada.",
    );
    if (ok) {
      resetLessonForm();
      router.refresh();
    }
  }

  async function deleteLesson(l: Lesson) {
    if (!confirm(`¿Eliminar la lección "${l.title}"?`)) return;
    const ok = await apiCall("DELETE", "/api/lessons", { id: l.id }, "Lección eliminada.");
    if (ok) {
      setLessonForm(EMPTY_LESSON);
      router.refresh();
    }
  }

  return (
    <>
      {msg && (
        <div
          className={`form-status ${msg.type === "ok" ? "ok" : "err"}`}
          role="status"
          style={{ marginBottom: 18 }}
        >
          {msg.text}
        </div>
      )}

      <div className="card" style={{ marginBottom: 28 }}>
        <h3>{courseForm.id ? "Editar nivel" : "Crear nuevo nivel"}</h3>
        <form
          onSubmit={handleCourseSubmit}
          style={{
            display: "grid",
            gridTemplateColumns: "80px 1fr",
            gap: 12,
            alignItems: "end",
            marginTop: 14,
          }}
        >
          <div className="field">
            <label>Nivel</label>
            <input
              type="number"
              min={1}
              required
              value={courseForm.level}
              onChange={(e) =>
                setCourseForm((f) => ({ ...f, level: e.target.value }))
              }
              style={inputStyle}
            />
          </div>
          <div className="field">
            <label>Título</label>
            <input
              required
              maxLength={200}
              placeholder="Ej: Nivel 1 — Fundamentos de la fe"
              value={courseForm.title}
              onChange={(e) =>
                setCourseForm((f) => ({ ...f, title: e.target.value }))
              }
              style={inputStyle}
            />
          </div>
          <div className="field" style={{ gridColumn: "span 2" }}>
            <label>Tagline (se muestra en la tarjeta pública)</label>
            <input
              maxLength={300}
              placeholder="Ej: Descubre el plan de Dios para tu vida"
              value={courseForm.tagline}
              onChange={(e) =>
                setCourseForm((f) => ({ ...f, tagline: e.target.value }))
              }
              style={inputStyle}
            />
          </div>
          <div className="field" style={{ gridColumn: "span 2" }}>
            <label>Descripción</label>
            <textarea
              rows={2}
              maxLength={1000}
              value={courseForm.description}
              onChange={(e) =>
                setCourseForm((f) => ({ ...f, description: e.target.value }))
              }
              style={{ ...inputStyle, resize: "vertical" }}
            />
          </div>
          <div className="field" style={{ gridColumn: "span 2" }}>
            <label>
              Slug{" "}
              <span style={{ fontWeight: 400, opacity: 0.6, fontSize: "0.8em" }}>
                (auto-generado si se deja vacío)
              </span>
            </label>
            <input
              maxLength={100}
              value={courseForm.slug}
              onChange={(e) =>
                setCourseForm((f) => ({ ...f, slug: e.target.value }))
              }
              placeholder="nivel-1-fundamentos-de-la-fe"
              style={inputStyle}
            />
          </div>
          <div style={{ gridColumn: "span 2", display: "flex", gap: 10, marginTop: 4 }}>
            <button
              type="submit"
              disabled={busy}
              className="btn btn-primary"
              style={{ padding: "10px 22px" }}
            >
              {busy
                ? "Guardando…"
                : courseForm.id
                  ? "Actualizar nivel"
                  : "Crear nivel"}
            </button>
            {courseForm.id && (
              <button
                type="button"
                className="btn"
                onClick={resetCourseForm}
                style={{ padding: "10px 22px" }}
              >
                Cancelar
              </button>
            )}
          </div>
        </form>
      </div>

      {!courses.length && (
        <div className="card" style={{ textAlign: "center", padding: 34 }}>
          <p style={{ color: "var(--ink-soft)", marginBottom: 14 }}>
            Aún no hay niveles de estudio creados.
          </p>
          <p style={{ color: "var(--ink-soft)", fontSize: "0.85rem" }}>
            Crea el primer nivel usando el formulario de arriba.
          </p>
        </div>
      )}

      {courses.map((c) => {
        const lessonList = lessons(c.id);
        const isOpen = expanded === c.id;

        return (
          <div key={c.id} className="card" style={{ marginBottom: 14, overflow: "hidden" }}>
            <div
              onClick={() => setExpanded(isOpen ? null : c.id)}
              style={{
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: 14,
                padding: "16px 0",
                userSelect: "none",
              }}
            >
              <span
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  width: 44,
                  height: 44,
                  borderRadius: 12,
                  background: "var(--sky-pale)",
                  color: "var(--sky-deep)",
                  fontWeight: 700,
                  fontSize: "1.1rem",
                  flexShrink: 0,
                }}
              >
                {String(c.level).padStart(2, "0")}
              </span>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 700, fontSize: "0.95rem" }}>
                  {c.title}
                </div>
                {c.tagline && (
                  <div style={{ fontSize: "0.82rem", color: "var(--ink-soft)" }}>
                    {c.tagline}
                  </div>
                )}
              </div>
              <span
                style={{
                  fontSize: "0.78rem",
                  color: "var(--ink-soft)",
                  whiteSpace: "nowrap",
                }}
              >
                {lessonList.length} lección{lessonList.length !== 1 && "es"}
              </span>
              <span
                style={{
                  fontSize: "1.1rem",
                  color: "var(--ink-soft)",
                  transform: isOpen ? "rotate(180deg)" : "rotate(0)",
                  transition: "transform 0.15s",
                }}
              >
                ▼
              </span>
            </div>

            {isOpen && (
              <div style={{ borderTop: "1px solid var(--line)", padding: "16px 0" }}>
                <div style={{ display: "flex", gap: 10, marginBottom: 16 }}>
                  <button
                    type="button"
                    className="btn btn-primary"
                    onClick={() => startLesson(c.id)}
                    style={{ padding: "8px 16px", fontSize: "0.82rem" }}
                  >
                    + Agregar lección
                  </button>
                  <button
                    type="button"
                    className="btn"
                    onClick={() => editCourse(c)}
                    style={{ padding: "8px 16px", fontSize: "0.82rem" }}
                  >
                    ✎ Editar nivel
                  </button>
                  <button
                    type="button"
                    className="btn"
                    onClick={() => deleteCourse(c)}
                    style={{
                      padding: "8px 16px",
                      fontSize: "0.82rem",
                      color: "var(--danger)",
                    }}
                  >
                    ✕ Eliminar
                  </button>
                </div>

                {!lessonList.length && (
                  <p style={{ color: "var(--ink-soft)", fontSize: "0.85rem" }}>
                    Este nivel aún no tiene lecciones. Haz clic en «Agregar lección»
                    para empezar.
                  </p>
                )}

                {lessonList.length > 0 && (
                  <table className="simple-table" style={{ fontSize: "0.85rem" }}>
                    <thead>
                      <tr>
                        <th style={{ width: 40 }}>#</th>
                        <th>Título</th>
                        <th>Módulo</th>
                        <th>Texto</th>
                        <th style={{ width: 70 }}>Min</th>
                        <th style={{ width: 100 }}>Acciones</th>
                      </tr>
                    </thead>
                    <tbody>
                      {lessonList.map((l, i) => (
                        <tr key={l.id}>
                          <td style={{ color: "var(--ink-soft)" }}>{l.sort_order || i + 1}</td>
                          <td style={{ fontWeight: 600 }}>{l.title}</td>
                          <td>{l.module_label || "—"}</td>
                          <td>{l.verse_ref || "—"}</td>
                          <td>{l.duration_min ?? 15}</td>
                          <td>
                            <div style={{ display: "flex", gap: 6 }}>
                              <button
                                type="button"
                                className="btn"
                                onClick={() => editLesson(l)}
                                style={{ fontSize: "0.78rem", padding: "4px 10px" }}
                              >
                                ✎
                              </button>
                              <button
                                type="button"
                                className="btn"
                                onClick={() => deleteLesson(l)}
                                style={{
                                  fontSize: "0.78rem",
                                  padding: "4px 10px",
                                  color: "var(--danger)",
                                }}
                              >
                                ✕
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            )}
          </div>
        );
      })}

      {lessonForm.course_id && (
        <div className="card" style={{ marginTop: 22 }}>
          <h3>{lessonForm.id ? "Editar lección" : "Nueva lección"}</h3>
          <form
            onSubmit={handleLessonSubmit}
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: 12,
              marginTop: 14,
            }}
          >
            <div className="field" style={{ gridColumn: "span 2" }}>
              <label>Título de la lección</label>
              <input
                required
                maxLength={200}
                placeholder="Ej: La oración del creyente"
                value={lessonForm.title}
                onChange={(e) =>
                  setLessonForm((f) => ({ ...f, title: e.target.value }))
                }
                style={inputStyle}
              />
            </div>
            <div className="field">
              <label>Módulo (ej: Módulo A)</label>
              <input
                maxLength={100}
                value={lessonForm.module_label}
                onChange={(e) =>
                  setLessonForm((f) => ({ ...f, module_label: e.target.value }))
                }
                style={inputStyle}
              />
            </div>
            <div className="field">
              <label>Referencia (ej: Juan 3:16)</label>
              <input
                maxLength={100}
                value={lessonForm.verse_ref}
                onChange={(e) =>
                  setLessonForm((f) => ({ ...f, verse_ref: e.target.value }))
                }
                style={inputStyle}
              />
            </div>
            <div className="field">
              <label>Duración (minutos)</label>
              <input
                type="number"
                min={1}
                value={lessonForm.duration_min}
                onChange={(e) =>
                  setLessonForm((f) => ({
                    ...f,
                    duration_min: e.target.value,
                  }))
                }
                style={inputStyle}
              />
            </div>
            <div className="field">
              <label>Orden</label>
              <input
                type="number"
                min={1}
                value={lessonForm.sort_order}
                onChange={(e) =>
                  setLessonForm((f) => ({ ...f, sort_order: e.target.value }))
                }
                placeholder="Auto"
                style={inputStyle}
              />
            </div>
            <div className="field" style={{ gridColumn: "span 2" }}>
              <label>Slug (auto-generado si se deja vacío)</label>
              <input
                maxLength={100}
                value={lessonForm.slug}
                onChange={(e) =>
                  setLessonForm((f) => ({ ...f, slug: e.target.value }))
                }
                style={inputStyle}
              />
            </div>
            <div className="field" style={{ gridColumn: "span 2" }}>
              <label>
                Contenido{" "}
                <span style={{ fontWeight: 400, opacity: 0.6, fontSize: "0.8em" }}>
                  (usa ## para títulos, &gt; para citas, - para listas; separa párrafos con línea en blanco)
                </span>
              </label>
              <textarea
                rows={14}
                required
                value={lessonForm.body}
                onChange={(e) =>
                  setLessonForm((f) => ({ ...f, body: e.target.value }))
                }
                style={{
                  ...inputStyle,
                  resize: "vertical",
                  lineHeight: 1.6,
                }}
                placeholder={`## Introducción\n\nPárrafo introductorio...\n\n## Desarrollo\n\n> Texto bíblico aquí\n\n- Punto uno\n- Punto dos\n\nPárrafo de cierre...`}
              />
            </div>
            <div style={{ gridColumn: "span 2", display: "flex", gap: 10, marginTop: 4 }}>
              <button
                type="submit"
                disabled={busy}
                className="btn btn-primary"
                style={{ padding: "10px 22px" }}
              >
                {busy
                  ? "Guardando…"
                  : lessonForm.id
                    ? "Actualizar lección"
                    : "Crear lección"}
              </button>
              <button
                type="button"
                className="btn"
                onClick={resetLessonForm}
                style={{ padding: "10px 22px" }}
              >
                Cancelar
              </button>
            </div>
          </form>
        </div>
      )}
    </>
  );
}
