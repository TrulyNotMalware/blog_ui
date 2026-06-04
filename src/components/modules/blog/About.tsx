import { Footer } from "@/components/layout/Footer";
import { Nav } from "@/components/layout/Nav";
import { MobileFooter, MobileHeader } from "@/components/modules/mobile/Chrome";
import type { Theme } from "@/types";

interface NowItem {
  type: string;
  text: string;
}

interface StackItem {
  key: string;
  value: string;
}

interface Props {
  theme?: Theme;
  now?: NowItem[];
  stack?: StackItem[];
  contact?: { label: string; value: string }[];
}

const DEFAULT_NOW: NowItem[] = [
  { type: "building", text: "notypiedev blog engine (this site)" },
  { type: "building", text: "pgmeter — Postgres 쿼리 시각화 도구" },
  { type: "writing", text: "OAuth 2.1 구현 가이드 (책, 진행 40%)" },
  { type: "reading", text: "Designing Data-Intensive Apps (다시)" },
];

const DEFAULT_STACK: StackItem[] = [
  { key: "languages", value: "TypeScript · Go · Python · SQL" },
  { key: "runtimes", value: "Bun · Node · Cloudflare Workers" },
  { key: "db", value: "Postgres · SQLite · Redis" },
  { key: "infra", value: "fly.io · cloudflare · litestream" },
  { key: "editor", value: "Neovim · Helix (시도 중)" },
];

const DEFAULT_CONTACT: { label: string; value: string }[] = [
  { label: "email", value: "notleebutyee@gmail.com" },
  { label: "github", value: "@TrulyNotMalware" },
];

export function About({
  theme,
  now = DEFAULT_NOW,
  stack = DEFAULT_STACK,
  contact = DEFAULT_CONTACT,
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
            나는 만드는 것에 대해 쓴다.
          </h1>
          <p
            style={{
              fontSize: 16,
              lineHeight: 1.7,
              color: "var(--ink-2)",
              margin: "0 0 16px",
            }}
          >
            notypiedev는 백엔드, 인프라, 그리고 그 사이의 어색한 영역에 대한 기록이다. 화려한
            비교 글이나{" "}
            <span className="icode">10 things you didn&apos;t know</span> 같은 건 없다.
          </p>
          <p
            style={{
              fontSize: 16,
              lineHeight: 1.7,
              color: "var(--ink-2)",
              margin: "0 0 32px",
            }}
          >
            대신 — 직접 부딪힌 문제, 잘못된 결정과 그걸 알아챈 순간, 다음에 다르게 할 것들에
            대해 쓴다. 정직하게.
          </p>

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
            {now.map((it) => (
              <li
                key={`${it.type}-${it.text}`}
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
              {stack.map((s) => (
                <tr key={s.key} style={{ borderBottom: "1px dashed var(--line)" }}>
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
              {contact.map((c) => (
                <tr key={c.label}>
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
