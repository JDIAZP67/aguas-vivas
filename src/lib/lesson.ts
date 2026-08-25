export interface Course {
  id: string
  slug: string
  level: number
  title: string
  tagline: string | null
  description: string | null
  sort_order: number
}

export interface Lesson {
  id: string
  course_id: string
  slug: string
  title: string
  module_label: string | null
  verse_ref: string | null
  body: string
  duration_min: number | null
  sort_order: number
}

export type LessonBlock =
  | { kind: 'heading'; text: string }
  | { kind: 'quote'; text: string }
  | { kind: 'list'; items: string[] }
  | { kind: 'para'; text: string }

export function parseLesson(body: string): LessonBlock[] {
  const blocks: LessonBlock[] = []
  const parts = body.split(/\n\n+/)

  for (const part of parts) {
    const trimmed = part.trim()
    if (!trimmed) continue

    if (trimmed.startsWith('## ')) {
      blocks.push({ kind: 'heading', text: trimmed.slice(3).trim() })
      continue
    }

    if (trimmed.startsWith('> ')) {
      blocks.push({ kind: 'quote', text: trimmed.replace(/^> /gm, '').trim() })
      continue
    }

    if (trimmed.split('\n').every((l) => l.trim().startsWith('- '))) {
      blocks.push({
        kind: 'list',
        items: trimmed.split('\n').map((l) => l.trim().slice(2).trim()),
      })
      continue
    }

    blocks.push({ kind: 'para', text: trimmed })
  }

  return blocks
}
