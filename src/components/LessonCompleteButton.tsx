"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function LessonCompleteButton({
  lessonId,
  initialDone,
}: {
  lessonId: string;
  initialDone: boolean;
}) {
  const router = useRouter();
  const [done, setDone] = useState(initialDone);
  const [busy, setBusy] = useState(false);

  async function toggle() {
    if (busy) return;
    setBusy(true);

    try {
      const res = await fetch("/api/progress", {
        method: done ? "DELETE" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ lessonId }),
      });

      if (res.ok) {
        setDone(!done);
        router.refresh();
      }
    } catch {
    } finally {
      setBusy(false);
    }
  }

  return (
    <button
      type="button"
      onClick={toggle}
      disabled={busy}
      className={`complete-btn ${done ? "done" : "pending"}`}
    >
      {busy
        ? "Guardando…"
        : done
          ? "✓ Lección completada — clic para desmarcar"
          : "Marcar lección como completada"}
    </button>
  );
}
