"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useUIStore } from "@/stores/useUIStore";
import type { Post } from "@/types";
import { postDate } from "@/utils/date";

interface HeaderProps {
  showBack?: boolean;
}

export function MobileHeader({ showBack }: HeaderProps) {
  const router = useRouter();
  const openSearch = useUIStore((s) => s.openSearch);
  const openMobileMenu = useUIStore((s) => s.openMobileMenu);

  return (
    <header
      style={{
        padding: "16px 18px 14px",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        borderBottom: "1px dashed var(--line-2)",
        background: "var(--bg)",
        gap: 12,
      }}
    >
      {showBack ? (
        <button
          type="button"
          className="mono"
          onClick={() => router.back()}
          style={{
            fontSize: 12,
            color: "var(--ink-3)",
            textDecoration: "none",
            display: "flex",
            alignItems: "center",
            gap: 6,
            cursor: "pointer",
            background: "transparent",
            border: "none",
            padding: 0,
            fontFamily: "var(--mono)",
          }}
        >
          <span>←</span> /index
        </button>
      ) : (
        <div
          className="mono"
          style={{
            fontSize: 13,
            color: "var(--ink)",
            display: "flex",
            alignItems: "center",
            gap: 6,
            flex: 1,
            minWidth: 0,
          }}
        >
          <span style={{ color: "var(--ink-3)" }}>~</span>
          <span style={{ color: "var(--ink-4)" }}>$</span>
          <span style={{ fontWeight: 600 }}>notypiedev</span>
        </div>
      )}
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <button
          type="button"
          aria-label="open search"
          onClick={() => openSearch()}
          style={{
            width: 32,
            height: 32,
            border: "1px solid var(--line-2)",
            background: "var(--bg-1)",
            cursor: "pointer",
            padding: 0,
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            color: "var(--ink-2)",
          }}
        >
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
          >
            <circle cx="11" cy="11" r="7" />
            <path d="m21 21-4.3-4.3" />
          </svg>
        </button>
        <button
          type="button"
          aria-label="open menu"
          onClick={openMobileMenu}
          style={{
            width: 32,
            height: 32,
            border: "1px solid var(--line-2)",
            background: "var(--bg-1)",
            cursor: "pointer",
            padding: 0,
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            color: "var(--ink-2)",
          }}
        >
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path d="M4 7h16M4 12h16M4 17h10" />
          </svg>
        </button>
      </div>
    </header>
  );
}

export function MobileFooter() {
  const year = new Date().getFullYear();
  return (
    <footer
      style={{
        padding: "20px 18px 28px",
        borderTop: "1px dashed var(--line-2)",
        marginTop: 32,
        fontFamily: "var(--mono)",
        fontSize: 11,
        color: "var(--ink-4)",
        display: "flex",
        flexDirection: "column",
        gap: 8,
      }}
    >
      <span>// © {year} notypiedev</span>
      <div style={{ display: "flex", gap: 16 }}>
        <a
          style={{ color: "inherit", textDecoration: "none" }}
          href="https://github.com/notypiedev"
        >
          github
        </a>
        <a
          style={{ color: "inherit", textDecoration: "none" }}
          href="mailto:hi@notypiedev.com"
        >
          email
        </a>
      </div>
    </footer>
  );
}

export function MobilePostCard({ post }: { post: Post }) {
  return (
    <Link
      href={`/posts/${post.id}`}
      style={{
        display: "flex",
        flexDirection: "column",
        border: "1px solid var(--line-2)",
        background: "var(--bg-1)",
        cursor: "pointer",
        textDecoration: "none",
        color: "inherit",
      }}
    >
      <div
        className="mono"
        style={{
          display: "flex",
          alignItems: "center",
          gap: 10,
          padding: "8px 12px",
          borderBottom: "1px dashed var(--line-2)",
          fontSize: 10,
          color: "var(--ink-4)",
        }}
      >
        <span
          style={{
            color: "var(--ink-2)",
            textTransform: "uppercase",
            letterSpacing: "0.08em",
          }}
        >
          {post.kind}
        </span>
        <span>·</span>
        <span>{postDate(post.date)}</span>
        <span style={{ marginLeft: "auto" }}>{post.readTime}</span>
      </div>
      <div style={{ padding: "12px 14px", display: "flex", flexDirection: "column", gap: 8 }}>
        <h3
          style={{
            fontSize: 14,
            lineHeight: 1.35,
            margin: 0,
            fontWeight: 600,
            letterSpacing: "-0.005em",
            color: "var(--ink)",
            textWrap: "pretty",
          }}
        >
          {post.title}
        </h3>
        <p
          style={{
            fontSize: 12,
            lineHeight: 1.55,
            color: "var(--ink-3)",
            margin: 0,
            textWrap: "pretty",
          }}
        >
          {post.excerpt.length > 75 ? post.excerpt.slice(0, 75) + "…" : post.excerpt}
        </p>
        <div
          className="mono"
          style={{
            fontSize: 10,
            color: "var(--ink-4)",
            display: "flex",
            gap: 8,
            marginTop: 4,
          }}
        >
          {post.tags.slice(0, 3).map((t) => (
            <span key={t}>#{t}</span>
          ))}
        </div>
      </div>
    </Link>
  );
}

export function MobileFeaturedCard({ post }: { post: Post }) {
  return (
    <Link
      href={`/posts/${post.id}`}
      style={{
        display: "block",
        position: "relative",
        background: "var(--bg)",
        cursor: "pointer",
        textDecoration: "none",
        color: "inherit",
        paddingTop: 16,
        marginBottom: 24,
      }}
    >
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          height: 2,
          background: "var(--ink)",
        }}
      />
      <div
        className="mono"
        style={{
          display: "flex",
          alignItems: "center",
          gap: 10,
          fontSize: 10,
          color: "var(--ink-4)",
          letterSpacing: "0.12em",
          marginBottom: 12,
          textTransform: "uppercase",
        }}
      >
        <span
          style={{
            color: "var(--ink)",
            background: "var(--bg-2)",
            padding: "2px 6px",
            border: "1px solid var(--line-2)",
          }}
        >
          ★ pinned · {post.kind}
        </span>
        <span>{post.readTime}</span>
      </div>
      <h2
        style={{
          fontSize: 22,
          lineHeight: 1.25,
          margin: "0 0 10px",
          fontWeight: 600,
          letterSpacing: "-0.02em",
          color: "var(--ink)",
          textWrap: "pretty",
        }}
      >
        {post.title}
      </h2>
      <div
        style={{
          background: "var(--bg-1)",
          border: "1px solid var(--line)",
          padding: "12px 14px",
          marginBottom: 12,
        }}
      >
        <pre
          className="mono"
          style={{
            margin: 0,
            fontSize: 10,
            color: "var(--ink-3)",
            lineHeight: 1.25,
            whiteSpace: "pre",
          }}
        >
          {`./bitnami  ████░░░░  3am
              ↓
./scratch  ████████  8am`}
        </pre>
      </div>
      <p
        style={{
          fontSize: 13,
          lineHeight: 1.6,
          color: "var(--ink-2)",
          margin: "0 0 12px",
        }}
      >
        {post.excerpt}
      </p>
      <div style={{ display: "flex", alignItems: "center" }}>
        <div
          className="mono"
          style={{ fontSize: 10, color: "var(--ink-4)", display: "flex", gap: 8 }}
        >
          {post.tags.map((t) => (
            <span key={t}>#{t}</span>
          ))}
        </div>
        <span
          className="mono"
          style={{
            marginLeft: "auto",
            fontSize: 11,
            color: "var(--ink)",
            borderBottom: "1px solid var(--ink)",
            paddingBottom: 1,
          }}
        >
          read essay →
        </span>
      </div>
    </Link>
  );
}
