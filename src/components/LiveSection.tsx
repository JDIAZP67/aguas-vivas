"use client";

import Link from "next/link";
import { toEmbedUrl } from "@/lib/youtube";
import type { Session } from "@/lib/types";

interface LiveSectionProps {
  liveSession: Session | null;
  upcoming: Session[];
}

export default function LiveSection({ liveSession, upcoming }: LiveSectionProps) {
  const selected = liveSession ?? upcoming[0] ?? null;

  const isLive = selected?.status === "en_vivo";
  const embed = isLive ? toEmbedUrl(selected?.video_url ?? null) : null;

  return (
    <div className="live-screen">
      {isLive ? (
        <>
          <div className="live-badge">EN VIVO</div>
          {embed ? (
            <div
              style={{
                position: "absolute",
                inset: 0,
                width: "100%",
                height: "100%",
              }}
            >
              <iframe
                src={`${embed}?autoplay=0`}
                title={selected?.title}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                style={{
                  width: "100%",
                  height: "100%",
                  border: "none",
                }}
              />
            </div>
          ) : (
            <p className="live-soon" style={{ padding: "0 30px" }}>
              Estamos transmitiendo:
              <br />
              <strong style={{ color: "#fff" }}>{selected?.title}</strong>
              <br />
              <br />
              Conéctate por el enlace que compartió la iglesia.
            </p>
          )}
          <div
            style={{
              position: "absolute",
              bottom: 16,
              left: 16,
              right: 16,
              display: "flex",
              justifyContent: "space-between",
              fontFamily: "var(--font-mono)",
              fontSize: "0.75rem",
              color: embed ? "rgba(244,248,250,0)" : "rgba(244,248,250,0.75)",
            }}
          >
            <span>{selected?.host_name ?? "Hermano Pablo"}</span>
            <span>{embed ? "" : "transmisión activa"}</span>
          </div>
        </>
      ) : selected ? (
        <>
          <div className="live-badge" style={{ background: "#1c8a5c" }}>
            PRÓXIMA SESIÓN
          </div>
          <p className="live-soon">
            <strong style={{ color: "#fff", fontSize: "1rem" }}>
              {selected.title}
            </strong>
            <br />
            {selected.starts_at &&
              new Date(selected.starts_at).toLocaleString("es-PE", {
                weekday: "long",
                day: "numeric",
                month: "long",
                hour: "2-digit",
                minute: "2-digit",
              })}
          </p>
          <div
            style={{
              position: "absolute",
              bottom: 16,
              left: 16,
              right: 16,
              display: "flex",
              justifyContent: "space-between",
              fontFamily: "var(--font-mono)",
              fontSize: "0.75rem",
              color: "rgba(244,248,250,0.75)",
            }}
          >
            <span>{selected.host_name ?? "Pastorado"}</span>
            <span>te esperamos</span>
          </div>
        </>
      ) : (
        <>
          <p className="live-soon">
            No hay transmisiones programadas en este momento.
            <br />
            Revisa la biblioteca de grabaciones mientras tanto.
          </p>
          <Link
            href="/biblioteca"
            className="pbtn pbtn-ghost"
            style={{ position: "relative", zIndex: 3 }}
          >
            Ver biblioteca →
          </Link>
        </>
      )}
    </div>
  );
}
