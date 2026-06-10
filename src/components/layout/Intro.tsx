import { DEFAULT_INTRO } from "@/services/contentService";

interface Props {
  lines?: string[];
}

export function Intro({ lines = DEFAULT_INTRO.lines }: Props) {
  return (
    <div
      style={{
        padding: "18px 22px",
        border: "1px solid var(--line-2)",
        background: "var(--bg-1)",
        marginBottom: 32,
        display: "flex",
        alignItems: "flex-start",
        gap: 18,
      }}
    >
      <span className="mono" style={{ fontSize: 12, color: "var(--ink-3)", marginTop: 2 }}>
        {">"}_
      </span>
      <div className="mono" style={{ fontSize: 13, lineHeight: 1.7, color: "var(--ink-2)" }}>
        {lines.map((line, i) => (
          // Render-only list with fixed order — index keys are correct and
          // survive duplicate lines (author-entered content is not unique).
          <span key={i}>
            {line}
            {i < lines.length - 1 && <br />}
          </span>
        ))}
      </div>
    </div>
  );
}
