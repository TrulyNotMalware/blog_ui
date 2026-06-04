import Link from "next/link";
import type { Post } from "@/types";
import { postDate } from "@/utils/date";

interface PostRowProps {
  post: Post;
  lastInGroup?: boolean;
  highlightTag?: string;
}

export function PostRow({ post, lastInGroup, highlightTag }: PostRowProps) {
  return (
    <Link
      href={`/posts/${post.id}`}
      style={{
        display: "grid",
        gridTemplateColumns: "110px 1fr auto",
        gap: 20,
        padding: "14px 8px",
        cursor: "pointer",
        borderBottom: lastInGroup ? "none" : "1px solid var(--line)",
        textDecoration: "none",
        color: "inherit",
        alignItems: "baseline",
      }}
    >
      <span className="mono" style={{ fontSize: 12, color: "var(--ink-4)" }}>
        {postDate(post.date)}
      </span>
      <div>
        <div
          style={{
            fontSize: 15,
            color: "var(--ink)",
            marginBottom: 4,
            fontWeight: 500,
            letterSpacing: "-0.005em",
          }}
        >
          {post.title}
        </div>
        <div
          className="mono"
          style={{ fontSize: 11, color: "var(--ink-4)", display: "flex", gap: 14 }}
        >
          <span
            style={{
              color: "var(--ink-3)",
              textTransform: "uppercase",
              letterSpacing: "0.05em",
            }}
          >
            {post.kind}
          </span>
          {post.tags.map((t) => (
            <span key={t} style={{ color: t === highlightTag ? "var(--ink)" : "inherit" }}>
              #{t}
            </span>
          ))}
        </div>
      </div>
      <span className="mono" style={{ fontSize: 11, color: "var(--ink-4)" }}>
        {post.readTime}
      </span>
    </Link>
  );
}

export function PostCard({ post }: { post: Post }) {
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
        position: "relative",
      }}
    >
      <div
        className="mono"
        style={{
          display: "flex",
          alignItems: "center",
          gap: 10,
          padding: "10px 14px",
          borderBottom: "1px dashed var(--line-2)",
          fontSize: 11,
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
      <div
        style={{
          padding: "16px 18px 14px",
          display: "flex",
          flexDirection: "column",
          gap: 10,
          flex: 1,
        }}
      >
        <h3
          style={{
            fontSize: 16,
            lineHeight: 1.35,
            margin: 0,
            fontWeight: 600,
            letterSpacing: "-0.01em",
            color: "var(--ink)",
            textWrap: "pretty",
          }}
        >
          {post.title}
        </h3>
        <p
          style={{
            fontSize: 13,
            lineHeight: 1.55,
            color: "var(--ink-3)",
            margin: 0,
            textWrap: "pretty",
          }}
        >
          {post.excerpt.length > 95 ? post.excerpt.slice(0, 95) + "…" : post.excerpt}
        </p>
        <div
          className="mono"
          style={{
            fontSize: 11,
            color: "var(--ink-4)",
            display: "flex",
            gap: 10,
            marginTop: "auto",
            paddingTop: 4,
          }}
        >
          {post.tags.map((t) => (
            <span key={t}>#{t}</span>
          ))}
        </div>
      </div>
      <div
        className="mono"
        style={{
          padding: "8px 14px",
          borderTop: "1px dashed var(--line-2)",
          fontSize: 11,
          color: "var(--ink-3)",
          display: "flex",
          alignItems: "center",
          gap: 8,
        }}
      >
        <span style={{ color: "var(--ink-3)" }}>$</span>
        <span style={{ color: "var(--ink-4)" }}>cat</span>
        <span>{post.id}.md</span>
        <span style={{ marginLeft: "auto", color: "var(--ink-3)" }}>→</span>
      </div>
    </Link>
  );
}

export function FeaturedCard({ post }: { post: Post }) {
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
        marginBottom: 36,
        paddingTop: 22,
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
          gap: 14,
          fontSize: 11,
          color: "var(--ink-4)",
          letterSpacing: "0.12em",
          marginBottom: 18,
          textTransform: "uppercase",
          flexWrap: "wrap",
        }}
      >
        <span
          style={{
            color: "var(--ink)",
            background: "var(--bg-2)",
            padding: "3px 8px",
            border: "1px solid var(--line-2)",
          }}
        >
          ★ pinned · {post.kind}
        </span>
        <span>{postDate(post.date)}</span>
        <span>·</span>
        <span>{post.readTime}</span>
        <span style={{ marginLeft: "auto", color: "var(--ink-3)" }}>/{post.id}.md</span>
      </div>

      <div className="featured-grid">
        <div
          style={{
            background: "var(--bg-1)",
            border: "1px solid var(--line)",
            padding: "20px 18px 16px",
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            minHeight: 220,
          }}
        >
          <pre
            className="mono"
            style={{
              margin: 0,
              fontSize: 11,
              color: "var(--ink-3)",
              lineHeight: 1.2,
              whiteSpace: "pre",
            }}
          >
            {`./bitnami
   ████░░░░
   ████▒░░░
   ████▒▒░░
   ▒▒▒▒▒▒▒▒   <- 3am
       ↓
./scratch
   ░░░░░░░░
   ░░██░░░░
   ░██████░
   ████████   <- 8am`}
          </pre>
          <div
            className="mono"
            style={{
              fontSize: 10,
              color: "var(--ink-4)",
              textAlign: "right",
              marginTop: 12,
            }}
          >
            $ diff before.tf after.tf
          </div>
        </div>

        <div
          style={{
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            paddingTop: 4,
          }}
        >
          <div>
            <h2
              style={{
                fontSize: 34,
                lineHeight: 1.15,
                margin: "0 0 18px",
                fontWeight: 600,
                letterSpacing: "-0.025em",
                color: "var(--ink)",
                textWrap: "pretty",
              }}
            >
              {post.title}
            </h2>
            <p
              style={{
                fontSize: 16,
                lineHeight: 1.65,
                color: "var(--ink-2)",
                margin: "0 0 20px",
                textWrap: "pretty",
                maxWidth: 620,
              }}
            >
              {post.excerpt}
            </p>
          </div>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 16,
              flexWrap: "wrap",
            }}
          >
            <div
              className="mono"
              style={{
                fontSize: 11,
                color: "var(--ink-4)",
                display: "flex",
                gap: 12,
              }}
            >
              {post.tags.map((t) => (
                <span key={t}>#{t}</span>
              ))}
            </div>
            <span
              className="mono"
              style={{
                marginLeft: "auto",
                fontSize: 12,
                color: "var(--ink)",
                display: "inline-flex",
                alignItems: "center",
                gap: 8,
                borderBottom: "1px solid var(--ink)",
                paddingBottom: 2,
              }}
            >
              read essay →
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
}
