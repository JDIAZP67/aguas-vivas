import { parseLesson } from "@/lib/lesson";

function renderInline(text: string, keyPrefix: string) {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return parts.map((p, i) =>
    p.startsWith("**") && p.endsWith("**") ? (
      <strong key={`${keyPrefix}-b${i}`}>{p.slice(2, -2)}</strong>
    ) : (
      p
    ),
  );
}

export default function LessonBody({ body }: { body: string }) {
  const blocks = parseLesson(body);

  return (
    <div className="lesson-body">
      {blocks.map((b, i) => {
        switch (b.kind) {
          case "heading":
            return <h3 key={i}>{b.text}</h3>;
          case "quote":
            return (
              <blockquote key={i} className="lesson-quote">
                {renderInline(b.text, `q${i}`)}
              </blockquote>
            );
          case "list":
            return (
              <ul key={i}>
                {b.items.map((it, j) => (
                  <li key={j}>{renderInline(it, `l${i}-${j}`)}</li>
                ))}
              </ul>
            );
          default:
            return <p key={i}>{renderInline(b.text, `p${i}`)}</p>;
        }
      })}
    </div>
  );
}
