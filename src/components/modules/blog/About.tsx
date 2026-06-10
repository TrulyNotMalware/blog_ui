import { Footer } from "@/components/layout/Footer";
import { Nav } from "@/components/layout/Nav";
import { MobileFooter, MobileHeader } from "@/components/modules/mobile/Chrome";
import { DEFAULT_ABOUT } from "@/services/contentService";
import type { Theme } from "@/types";

interface Props {
  theme?: Theme;
  headline?: string;
  paragraphs?: string[];
  now?: { type: string; text: string }[];
  stack?: { key: string; value: string }[];
  contact?: { label: string; value: string }[];
}

/**
 * Renders a paragraph string, splitting on backtick-delimited segments so that
 * `inline code` becomes <span className="icode">inline code</span>.
 */
function ParagraphWithCode({ text }: { text: string }) {
  const parts = text.split("`");
  return (
    <>
      {parts.map((part, i) =>
        i % 2 === 1 ? (
          // odd index = inside backticks → inline code
          <span key={`code-${i}`} className="icode">
            {part}
          </span>
        ) : (
          // even index = plain text segment; React renders string nodes fine
          <span key={`text-${i}`}>{part}</span>
        ),
      )}
    </>
  );
}

export function About({
  theme,
  headline = DEFAULT_ABOUT.headline,
  paragraphs = DEFAULT_ABOUT.paragraphs,
  now = DEFAULT_ABOUT.now,
  stack = DEFAULT_ABOUT.stack,
  contact = DEFAULT_ABOUT.contact,
}: Props) {
  return (
    <div className="blog-frame" data-theme={theme}>
      <div data-viewport="desktop">
        <Nav active="about" />
      </div>
      <div data-viewport="mobile">
        <MobileHeader />
      </div>
      <div className="about-page-grid">
        <div>
          <div
            className="mono"
            style={{
              fontSize: 11,
              color: "var(--ink-4)",
              letterSpacing: "0.1em",
              marginBottom: 16,
            }}
          >
            ── about.md ──
          </div>
          <h1
            style={{
              fontSize: 28,
              lineHeight: 1.25,
              margin: "0 0 20px",
              fontWeight: 600,
              letterSpacing: "-0.02em",
            }}
          >
            {headline}
          </h1>
          {/* CMS-driven render-only lists below use index keys: order is fixed
              and author-entered rows are not guaranteed unique. */}
          {paragraphs.map((text, i) => (
            <p
              key={i}
              style={{
                fontSize: 16,
                lineHeight: 1.7,
                color: "var(--ink-2)",
                margin: i < paragraphs.length - 1 ? "0 0 16px" : "0 0 32px",
              }}
            >
              <ParagraphWithCode text={text} />
            </p>
          ))}

          <div
            className="mono"
            style={{
              fontSize: 11,
              color: "var(--ink-4)",
              letterSpacing: "0.1em",
              marginBottom: 14,
            }}
          >
            // now
          </div>
          <ul
            style={{
              listStyle: "none",
              padding: 0,
              margin: "0 0 32px",
              display: "flex",
              flexDirection: "column",
              gap: 8,
            }}
          >
            {now.map((it, i) => (
              <li
                key={i}
                style={{
                  display: "grid",
                  gridTemplateColumns: "90px 1fr",
                  gap: 12,
                  alignItems: "baseline",
                }}
              >
                <span
                  className="mono"
                  style={{
                    fontSize: 11,
                    color: "var(--ink-4)",
                    textTransform: "uppercase",
                    letterSpacing: "0.06em",
                  }}
                >
                  {it.type}
                </span>
                <span style={{ fontSize: 14, color: "var(--ink-2)" }}>{it.text}</span>
              </li>
            ))}
          </ul>

          <div
            className="mono"
            style={{
              fontSize: 11,
              color: "var(--ink-4)",
              letterSpacing: "0.1em",
              marginBottom: 14,
            }}
          >
            // stack
          </div>
          <table
            className="mono"
            style={{
              fontSize: 13,
              color: "var(--ink-2)",
              borderCollapse: "collapse",
              width: "100%",
            }}
          >
            <tbody>
              {stack.map((s, i) => (
                <tr key={i} style={{ borderBottom: "1px dashed var(--line)" }}>
                  <td
                    style={{
                      padding: "8px 16px 8px 0",
                      color: "var(--ink-4)",
                      width: 100,
                    }}
                  >
                    {s.key}
                  </td>
                  <td style={{ padding: "8px 0" }}>{s.value}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <aside>
          <div
            className="mono"
            style={{
              fontSize: 11,
              color: "var(--ink-4)",
              letterSpacing: "0.1em",
              marginBottom: 12,
            }}
          >
            // contact
          </div>
          <table
            className="mono"
            style={{ fontSize: 12, color: "var(--ink-2)", width: "100%" }}
          >
            <tbody>
              {contact.map((c, i) => (
                <tr key={i}>
                  <td
                    style={{
                      padding: "4px 12px 4px 0",
                      color: "var(--ink-4)",
                      width: 70,
                    }}
                  >
                    {c.label}
                  </td>
                  <td>{c.value}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </aside>
      </div>
      <div data-viewport="desktop">
        <Footer />
      </div>
      <div data-viewport="mobile">
        <MobileFooter />
      </div>
    </div>
  );
}
