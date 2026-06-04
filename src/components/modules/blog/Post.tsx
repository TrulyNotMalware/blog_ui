import Link from "next/link";
import type { ReactNode } from "react";
import { Footer } from "@/components/layout/Footer";
import { Nav } from "@/components/layout/Nav";
import type { Post, Theme } from "@/types";
import { ShareButtons } from "./ShareButtons";
import { TocSidebar, type TocItem } from "./TocSidebar";

interface NavLink {
  title: string;
  id: string;
}

interface Props {
  theme?: Theme;
  post: Post;
  toc?: TocItem[];
  /** Prev/next strip slot. Streamed in via Suspense so the article body is not gated on it. */
  nav?: ReactNode;
  /** Read progress 0..100. Driven by a client wrapper; defaults to 0 (no progress). */
  progress?: number;
  children?: ReactNode;
}

export function PostView({
  theme,
  post,
  toc = [],
  nav,
  progress = 0,
  children,
}: Props) {
  return (
    <div className="blog-frame" data-theme={theme}>
      <Nav active="home" />
      <div style={{ height: 2, background: "var(--line)" }}>
        <div style={{ width: `${progress}%`, height: "100%", background: "var(--ink)" }} />
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "240px 1fr 240px",
          gap: 0,
          minHeight: "calc(100vh - 90px - 86px)",
        }}
      >
        <aside className="toc-aside">
          <div
            className="mono"
            style={{
              fontSize: 11,
              color: "var(--ink-4)",
              letterSpacing: "0.1em",
              marginBottom: 16,
            }}
          >
            // table of contents
          </div>
          <TocSidebar toc={toc} />
        </aside>

        <article style={{ padding: "40px 60px", maxWidth: 740, marginInline: "auto", width: "100%" }}>
          <div className="mono" style={{ fontSize: 11, color: "var(--ink-4)", marginBottom: 12 }}>
            posts/{post.date}.md · {post.kind} · {post.readTime}
          </div>
          <h1
            style={{
              fontSize: 30,
              lineHeight: 1.25,
              margin: "0 0 12px",
              fontWeight: 600,
              letterSpacing: "-0.02em",
            }}
          >
            {post.title}
          </h1>
          <div
            className="mono"
            style={{
              fontSize: 11,
              color: "var(--ink-3)",
              display: "flex",
              alignItems: "center",
              gap: 14,
              paddingBottom: 22,
              marginBottom: 28,
              borderBottom: "1px dashed var(--line-2)",
            }}
          >
            {post.tags.map((t) => (
              <span key={t}>#{t}</span>
            ))}
            <span style={{ marginLeft: "auto", color: "var(--ink-4)" }}>last edited 3d ago</span>
          </div>

          {children}
        </article>

        <aside style={{ padding: "32px 28px", borderLeft: "1px solid var(--line)" }}>
          <div
            className="mono"
            style={{
              fontSize: 11,
              color: "var(--ink-4)",
              letterSpacing: "0.1em",
              marginBottom: 12,
            }}
          >
            // share
          </div>
          <ShareButtons title={post.title} postId={post.id} />
          <div
            className="mono"
            style={{
              fontSize: 11,
              color: "var(--ink-4)",
              letterSpacing: "0.1em",
              marginTop: 28,
              marginBottom: 12,
            }}
          >
            // edit
          </div>
          <a
            className="mono"
            href={`https://github.com/notypiedev/blog/edit/main/posts/${post.id}.md`}
            style={{ fontSize: 12, color: "var(--ink-3)", textDecoration: "none" }}
          >
            ✎ suggest an edit on github →
          </a>
        </aside>
      </div>

      {nav}
      <Footer />
    </div>
  );
}

/**
 * Desktop prev/next strip. Split out of [PostView] so it can be wrapped in its own Suspense
 * boundary — the article body renders immediately while the nav (which needs an extra BE
 * round-trip) streams in.
 */
export function PostNavStrip({ prev, next }: { prev?: NavLink; next?: NavLink }) {
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "1fr 1fr",
        gap: 1,
        background: "var(--line)",
        borderTop: "1px solid var(--line)",
      }}
    >
      {prev ? (
        <Link
          href={`/posts/${prev.id}`}
          style={{
            padding: "18px 60px",
            background: "var(--bg)",
            display: "flex",
            flexDirection: "column",
            gap: 4,
            textDecoration: "none",
            color: "inherit",
          }}
        >
          <span className="mono" style={{ fontSize: 11, color: "var(--ink-4)" }}>
            ← previous
          </span>
          <span style={{ fontSize: 14, color: "var(--ink-2)", fontWeight: 500 }}>
            {prev.title}
          </span>
        </Link>
      ) : (
        <span style={{ background: "var(--bg)" }} />
      )}
      {next ? (
        <Link
          href={`/posts/${next.id}`}
          style={{
            padding: "18px 60px",
            background: "var(--bg)",
            display: "flex",
            flexDirection: "column",
            gap: 4,
            alignItems: "flex-end",
            textDecoration: "none",
            color: "inherit",
          }}
        >
          <span className="mono" style={{ fontSize: 11, color: "var(--ink-4)" }}>
            next →
          </span>
          <span style={{ fontSize: 14, color: "var(--ink-2)", fontWeight: 500 }}>
            {next.title}
          </span>
        </Link>
      ) : (
        <span style={{ background: "var(--bg)" }} />
      )}
    </div>
  );
}

interface CodeBlockProps {
  filename?: string;
  language?: string;
  lines: ReactNode[];
  showLineNumbers?: boolean;
}

export function CodeBlock({ filename, language, lines, showLineNumbers = true }: CodeBlockProps) {
  return (
    <div className="code" style={{ marginBottom: 18 }}>
      <div className="code-header">
        <span className="dot" />
        {filename && <span style={{ color: "var(--ink-3)" }}>{filename}</span>}
        {language && (
          <span style={{ marginLeft: "auto", color: "var(--ink-4)" }}>{language}</span>
        )}
        <span
          style={{
            color: "var(--ink-3)",
            cursor: "pointer",
            borderLeft: "1px solid var(--line)",
            paddingLeft: 10,
          }}
        >
          copy
        </span>
      </div>
      <div className="code-body">
        {showLineNumbers && (
          <div className="ln">
            {lines.map((_, i) => (
              <div key={i}>{i + 1}</div>
            ))}
          </div>
        )}
        <pre>
          {lines.map((l, i) => (
            <div key={i}>{l || "​"}</div>
          ))}
        </pre>
      </div>
    </div>
  );
}

export function Blockquote({ children }: { children: ReactNode }) {
  return (
    <div className="bq" style={{ margin: "0 0 22px", fontSize: 15 }}>
      {children}
    </div>
  );
}
