"use client";

import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

const DEMO_AUTH_COOKIE = "av_demo_auth";

export default function LogoutButton() {
  const router = useRouter();

  async function handleLogout() {
    try {
      if (process.env.NEXT_PUBLIC_SUPABASE_URL) {
        const supabase = createClient();
        await supabase.auth.signOut();
      } else if (typeof document !== "undefined") {
        document.cookie = `${DEMO_AUTH_COOKIE}=; path=/; max-age=0`;
      }
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
