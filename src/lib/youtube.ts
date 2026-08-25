const YT_HOSTS = [
  "youtube.com",
  "www.youtube.com",
  "youtu.be",
  "m.youtube.com",
]

export function extractYoutubeId(url: string): string | null {
  try {
    const u = new URL(url.trim())

    if (!YT_HOSTS.includes(u.hostname)) return null

    if (u.hostname === "youtu.be") {
      return u.pathname.slice(1).split("/")[0] || null
    }

    if (u.pathname.startsWith("/embed/")) {
      return u.pathname.split("/embed/")[1]?.split("/")[0] || null
    }

    if (u.pathname.startsWith("/live/")) {
      return u.pathname.split("/live/")[1]?.split("/")[0] || null
    }

    if (u.pathname.startsWith("/shorts/")) {
      return u.pathname.split("/shorts/")[1]?.split("/")[0] || null
    }

    return u.searchParams.get("v")
  } catch {
    return null
  }
}

export function toEmbedUrl(url: string | null): string | null {
  if (!url) return null
  const id = extractYoutubeId(url)
  return id ? `https://www.youtube.com/embed/${id}` : null
}
