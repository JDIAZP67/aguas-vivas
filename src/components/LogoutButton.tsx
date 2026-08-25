"use client";

import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function LogoutButton() {
  const router = useRouter();

  async function handleLogout() {
    try {
      const supabase = createClient();
      await supabase.auth.signOut();
    } catch {}
    router.push("/");
    router.refresh();
  }

  return (
    <button
      type="button"
      onClick={handleLogout}
      style={{
        marginTop: 14,
        width: "100%",
        padding: "9px 12px",
        borderRadius: 10,
        border: "1px solid rgba(244,248,250,0.25)",
        background: "transparent",
        color: "rgba(244,248,250,0.85)",
        fontFamily: "var(--font-body)",
        fontSize: "0.82rem",
        fontWeight: 600,
        cursor: "pointer",
      }}
    >
      Cerrar sesión
    </button>
  );
}
