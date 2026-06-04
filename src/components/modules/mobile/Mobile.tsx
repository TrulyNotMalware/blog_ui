import Link from "next/link";
import type { ReactNode } from "react";
import { StatusBadge } from "@/components/modules/admin/Shell";
import type { AdminPostRow, Post, PostStatus, Tag, Theme } from "@/types";
import { postDate } from "@/utils/date";
import { formatRelative } from "@/utils/relative";
import {
  MobileFeaturedCard,
  MobileFooter,
  MobileHeader,
  MobilePostCard,
} from "./Chrome";

interface BaseProps {
  theme?: Theme;
}

export function MobileHome({
  theme,
  posts,
  page = 1,
  totalPages = 1,
}: BaseProps & { posts: Post[]; page?: number; totalPages?: number }) {
  const featured = posts[0];
  const rest = posts.slice(1, 7);
  const prevPage = Math.max(1, page - 1);
  const nextPage = Math.min(totalPages, page + 1);
  const pageHref = (n: number) => (n <= 1 ? "/" : `/?page=${n}`);
  return (
    <div className="blog-frame" data-theme={theme}>
      <MobileHeader />
      <div style={{ padding: "20px 18px 0" }}>
        <div
          style={{
            padding: "12px 14px",
            border: "1px solid var(--line-2)",
            background: "var(--bg-1)",
            marginBottom: 20,
            display: "flex",
            alignItems: "flex-start",
            gap: 12,
          }}
        >
          <span className="mono" style={{ fontSize: 11, color: "var(--ink-3)" }}>
            {">"}_
          </span>
          <div
            className="mono"
            style={{ fontSize: 11, lineHeight: 1.65, color: "var(--ink-2)" }}
          >
            인프라·백엔드 사이의 어색한 영역에 대한 글.
          </div>
        </div>

        {featured && <MobileFeaturedCard post={featured} />}

        <div
          className="mono"
          style={{
            fontSize: 10,
            color: "var(--ink-4)",
            letterSpacing: "0.1em",
            marginBottom: 12,
            display: "flex",
            alignItems: "center",
            gap: 10,
          }}
        >
          <span>── recent</span>
          <span style={{ flex: 1, borderTop: "1px dashed var(--line)" }} />
          <span>{posts.length} posts</span>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {rest.map((p) => (
            <MobilePostCard key={p.id} post={p} />
          ))}
        </div>

        <nav
          aria-label="pagination"
          className="mono"
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 4,
            padding: "24px 0 12px",
            fontSize: 11,
          }}
        >
          <Link
            href={pageHref(prevPage)}
            aria-disabled={page === 1}
            style={{
              padding: "4px 8px",
              color: page === 1 ? "var(--ink-4)" : "var(--ink-3)",
              textDecoration: "none",
            }}
          >
            ← prev
          </Link>
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((n) => (
            <Link
              key={n}
              href={pageHref(n)}
              style={{
                padding: "4px 8px",
                background: n === page ? "var(--bg-2)" : "transparent",
                border: "1px solid " + (n === page ? "var(--line-2)" : "transparent"),
                color: n === page ? "var(--ink)" : "var(--ink-3)",
                textDecoration: "none",
              }}
            >
              {n.toString().padStart(2, "0")}
            </Link>
          ))}
          <Link
            href={pageHref(nextPage)}
            aria-disabled={page === totalPages}
            style={{
              padding: "4px 8px",
              color: page === totalPages ? "var(--ink-4)" : "var(--ink-2)",
              textDecoration: "none",
            }}
          >
            next →
          </Link>
        </nav>
      </div>
      <MobileFooter />
    </div>
  );
}

export function MobileDrawer({
  theme,
  tags,
  currentTheme = "dark",
}: BaseProps & { tags: Tag[]; currentTheme?: "dark" | "light" | "auto" }) {
  return (
    <div className="blog-frame" data-theme={theme} style={{ position: "relative" }}>
      <MobileHeader />
      <div style={{ padding: "20px 18px 0", opacity: 0.25 }}>
        <div
          style={{
            height: 64,
            background: "var(--bg-1)",
            border: "1px solid var(--line-2)",
            marginBottom: 20,
          }}
        />
        <div
          style={{
            height: 200,
            background: "var(--bg-1)",
            border: "1px solid var(--line-2)",
            marginBottom: 16,
          }}
        />
        <div
          style={{
            height: 120,
            background: "var(--bg-1)",
            border: "1px solid var(--line-2)",
          }}
        />
      </div>

      <div
        style={{
          position: "absolute",
          inset: "49px 0 0",
          background: "rgba(0,0,0,0.5)",
        }}
      />

      <aside
        style={{
          position: "absolute",
          top: 49,
          right: 0,
          bottom: 0,
          width: 280,
          background: "var(--bg)",
          borderLeft: "1px solid var(--line-2)",
          boxShadow: "-12px 0 30px rgba(0,0,0,0.35)",
          padding: "24px 22px",
          display: "flex",
          flexDirection: "column",
          gap: 28,
        }}
      >
        <nav
          className="mono"
          style={{ display: "flex", flexDirection: "column", gap: 4 }}
        >
          <div
            style={{
              fontSize: 10,
              color: "var(--ink-4)",
              letterSpacing: "0.1em",
              marginBottom: 10,
            }}
          >
            // navigate
          </div>
          {[
            { id: "home", label: "index", cmd: "ls" },
            { id: "tags", label: "tags", cmd: "ls ./tags" },
            { id: "about", label: "about", cmd: "cat about.md" },
          ].map((it) => (
            <a
              key={it.id}
              href={it.id === "home" ? "/" : `/${it.id}`}
              style={{
                padding: "10px 12px",
                display: "flex",
                alignItems: "baseline",
                gap: 12,
                borderLeft:
                  "2px solid " + (it.id === "home" ? "var(--ink)" : "transparent"),
                background: it.id === "home" ? "var(--bg-1)" : "transparent",
                textDecoration: "none",
                color: "inherit",
                fontSize: 14,
              }}
            >
              <span
                style={{
                  color: it.id === "home" ? "var(--ink)" : "var(--ink-2)",
                  fontWeight: 500,
                }}
              >
                {it.label}
              </span>
              <span
                style={{ marginLeft: "auto", fontSize: 10, color: "var(--ink-4)" }}
              >
                $ {it.cmd}
              </span>
            </a>
          ))}
        </nav>

        <div>
          <div
            className="mono"
            style={{
              fontSize: 10,
              color: "var(--ink-4)",
              letterSpacing: "0.1em",
              marginBottom: 12,
            }}
          >
            // theme
          </div>
          <div
            style={{
              display: "flex",
              gap: 8,
              padding: 4,
              border: "1px solid var(--line-2)",
              background: "var(--bg-1)",
            }}
          >
            {(["dark", "light", "auto"] as const).map((t) => {
              const isActive = t === currentTheme;
              return (
                <span
                  key={t}
                  className="mono"
                  style={{
                    flex: 1,
                    textAlign: "center",
                    padding: "8px 0",
                    fontSize: 12,
                    background: isActive ? "var(--bg-2)" : "transparent",
                    color: isActive ? "var(--ink)" : "var(--ink-3)",
                    cursor: "pointer",
                  }}
                >
                  {t}
                </span>
              );
            })}
          </div>
        </div>

        <div>
          <div
            className="mono"
            style={{
              fontSize: 10,
              color: "var(--ink-4)",
              letterSpacing: "0.1em",
              marginBottom: 12,
            }}
          >
            // tags
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
            {tags.slice(0, 8).map((t) => (
              <span key={t.name} className="tag mono" style={{ fontSize: 10 }}>
                #{t.name} <span style={{ color: "var(--ink-4)" }}>{t.count}</span>
              </span>
            ))}
          </div>
        </div>

        <div
          className="mono"
          style={{
            marginTop: "auto",
            fontSize: 10,
            color: "var(--ink-4)",
            display: "flex",
            justifyContent: "space-between",
          }}
        >
          <span>v1.0.4</span>
          <span>tap × to close</span>
        </div>
      </aside>
    </div>
  );
}

interface NavLink {
  title: string;
  id: string;
}

interface MobilePostProps extends BaseProps {
  post: Post;
  children?: ReactNode;
  progress?: number;
  /** Prev/next strip slot, streamed via Suspense so the body is not gated on it. */
  nav?: ReactNode;
}

export function MobilePost({
  theme,
  post,
  children,
  progress = 38,
  nav,
}: MobilePostProps) {
  return (
    <div className="blog-frame" data-theme={theme} style={{ position: "relative" }}>
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          height: 2,
          background: "var(--line)",
          zIndex: 5,
        }}
      >
        <div style={{ width: `${progress}%`, height: "100%", background: "var(--ink)" }} />
      </div>
      <MobileHeader showBack />

      <article style={{ padding: "18px 18px 0" }}>
        <div
          className="mono"
          style={{
            fontSize: 10,
            color: "var(--ink-4)",
            marginBottom: 8,
            letterSpacing: "0.05em",
          }}
        >
          posts/{post.date}.md · {post.kind} · {post.readTime}
        </div>
        <h1
          style={{
            fontSize: 22,
            lineHeight: 1.25,
            margin: "0 0 10px",
            fontWeight: 600,
            letterSpacing: "-0.02em",
          }}
        >
          {post.title}
        </h1>
        <div
          className="mono"
          style={{
            fontSize: 10,
            color: "var(--ink-3)",
            display: "flex",
            gap: 10,
            paddingBottom: 14,
            marginBottom: 18,
            borderBottom: "1px dashed var(--line-2)",
          }}
        >
          {post.tags.map((t) => (
            <span key={t}>#{t}</span>
          ))}
        </div>

        {children}
      </article>

      {nav}

      <button
        type="button"
        aria-label="open table of contents"
        style={{
          position: "fixed",
          right: 14,
          bottom: 56,
          zIndex: 4,
          width: 44,
          height: 44,
          borderRadius: 22,
          background: "var(--bg-2)",
          border: "1px solid var(--line-2)",
          color: "var(--ink)",
          cursor: "pointer",
          fontFamily: "var(--mono)",
          fontSize: 11,
          boxShadow: "var(--shadow)",
        }}
      >
        ≡
      </button>
    </div>
  );
}

/** Mobile prev/next strip, split out so it can stream in its own Suspense boundary. */
export function MobilePostNavStrip({ prev, next }: { prev?: NavLink; next?: NavLink }) {
  if (!prev && !next) return null;
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "1fr 1fr",
        gap: 1,
        background: "var(--line)",
        borderTop: "1px solid var(--line)",
        marginTop: 24,
      }}
    >
      {prev ? (
        <Link
          href={`/posts/${prev.id}`}
          style={{
            padding: "12px 14px",
            background: "var(--bg)",
            display: "flex",
            flexDirection: "column",
            gap: 3,
            textDecoration: "none",
            color: "inherit",
          }}
        >
          <span className="mono" style={{ fontSize: 10, color: "var(--ink-4)" }}>
            ← previous
          </span>
          <span style={{ fontSize: 12, color: "var(--ink-2)", fontWeight: 500, lineHeight: 1.3 }}>
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
            padding: "12px 14px",
            background: "var(--bg)",
            display: "flex",
            flexDirection: "column",
            gap: 3,
            alignItems: "flex-end",
            textDecoration: "none",
            color: "inherit",
          }}
        >
          <span className="mono" style={{ fontSize: 10, color: "var(--ink-4)" }}>
            next →
          </span>
          <span style={{ fontSize: 12, color: "var(--ink-2)", fontWeight: 500, lineHeight: 1.3 }}>
            {next.title}
          </span>
        </Link>
      ) : (
        <span style={{ background: "var(--bg)" }} />
      )}
    </div>
  );
}

export function MobileTags({
  theme,
  selected,
  posts,
  tags,
}: BaseProps & { selected?: string; posts: Post[]; tags: Tag[] }) {
  const filtered = selected ? posts.filter((p) => p.tags.includes(selected)) : posts;
  return (
    <div className="blog-frame" data-theme={theme}>
      <MobileHeader />
      <div style={{ padding: "18px 18px 0" }}>
        <div
          className="mono"
          style={{
            fontSize: 11,
            color: "var(--ink-3)",
            marginBottom: 6,
            display: "flex",
            gap: 6,
          }}
        >
          <span style={{ color: "var(--ink-3)" }}>$</span> ls ./tags/
        </div>
        <h1
          className="mono"
          style={{
            fontSize: 18,
            fontWeight: 600,
            margin: "0 0 18px",
            letterSpacing: "-0.01em",
          }}
        >
          tags{" "}
          <span style={{ color: "var(--ink-4)", fontWeight: 400 }}>({tags.length})</span>
        </h1>

        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: 10,
            marginBottom: 24,
            paddingBottom: 18,
            borderBottom: "1px dashed var(--line-2)",
          }}
        >
          {tags.map((t) => {
            const size = 11 + Math.min(t.count, 14) * 0.55;
            const isSel = t.name === selected;
            return (
              <Link
                key={t.name}
                href={`/tags/${t.name}`}
                className="mono"
                style={{
                  fontSize: size,
                  color: isSel
                    ? "var(--bg)"
                    : t.count > 7
                      ? "var(--ink)"
                      : "var(--ink-2)",
                  background: isSel ? "var(--ink)" : "transparent",
                  padding: isSel ? "0 5px" : 0,
                  cursor: "pointer",
                  textDecoration: "none",
                  display: "inline-flex",
                  alignItems: "baseline",
                  gap: 3,
                }}
              >
                #{t.name}
                <span
                  style={{
                    fontSize: 9,
                    color: isSel ? "var(--bg-2)" : "var(--ink-4)",
                  }}
                >
                  {t.count}
                </span>
              </Link>
            );
          })}
        </div>

        <div
          className="mono"
          style={{
            fontSize: 11,
            color: "var(--ink-3)",
            marginBottom: 12,
            display: "flex",
            alignItems: "center",
            gap: 6,
          }}
        >
          <span style={{ color: "var(--ink-3)" }}>$</span> ls ./tags/
          <span style={{ color: "var(--ink)" }}>{selected}</span>/
          <span style={{ marginLeft: "auto", color: "var(--ink-4)" }}>
            {filtered.length} files
          </span>
        </div>

        {filtered.slice(0, 5).map((p, i, arr) => (
          <Link
            key={p.id}
            href={`/posts/${p.id}`}
            style={{
              display: "flex",
              flexDirection: "column",
              gap: 4,
              padding: "12px 0",
              borderBottom: i < arr.length - 1 ? "1px solid var(--line)" : "none",
              textDecoration: "none",
              color: "inherit",
            }}
          >
            <div
              style={{
                fontSize: 14,
                color: "var(--ink)",
                fontWeight: 500,
                letterSpacing: "-0.005em",
              }}
            >
              {p.title}
            </div>
            <div
              className="mono"
              style={{
                fontSize: 10,
                color: "var(--ink-4)",
                display: "flex",
                gap: 10,
              }}
            >
              <span>{postDate(p.date)}</span>
              <span>·</span>
              <span>{p.readTime}</span>
              <span style={{ marginLeft: "auto" }}>
                {p.tags.map((t) => (
                  <span
                    key={t}
                    style={{
                      color: t === selected ? "var(--ink-2)" : "inherit",
                      marginLeft: 6,
                    }}
                  >
                    #{t}
                  </span>
                ))}
              </span>
            </div>
          </Link>
        ))}
      </div>
      <MobileFooter />
    </div>
  );
}

export function MobileSearch({
  theme,
  query,
  matches,
  tags,
}: BaseProps & { query: string; matches: Post[]; tags: Tag[] }) {
  const m = matches;
  const tm = tags;

  return (
    <div
      className="blog-frame"
      data-theme={theme}
      style={{ position: "relative", fontFamily: "var(--mono)" }}
    >
      <header
        style={{
          padding: "14px 18px",
          borderBottom: "1px dashed var(--line-2)",
          display: "flex",
          alignItems: "center",
          gap: 10,
        }}
      >
        <span style={{ color: "var(--ink-3)", fontSize: 13 }}>$</span>
        <span style={{ color: "var(--ink-4)", fontSize: 13 }}>grep -ri &quot;</span>
        <span style={{ color: "var(--ink)", fontSize: 14 }}>{query}</span>
        <span
          style={{
            display: "inline-block",
            width: 7,
            height: 13,
            background: "var(--ink)",
          }}
        />
        <span style={{ color: "var(--ink-4)", fontSize: 13 }}>&quot;</span>
        <a
          style={{
            marginLeft: "auto",
            fontSize: 11,
            color: "var(--ink-3)",
            textDecoration: "none",
          }}
        >
          cancel
        </a>
      </header>

      <div style={{ padding: "14px 0 0" }}>
        <div
          style={{
            padding: "0 18px 6px",
            fontSize: 9,
            color: "var(--ink-4)",
            letterSpacing: "0.12em",
          }}
        >
          // POSTS · {m.length}
        </div>
        {m.slice(0, 4).map((p, i) => {
          const sel = i === 0;
          return (
            <Link
              key={p.id}
              href={`/posts/${p.id}`}
              style={{
                display: "flex",
                flexDirection: "column",
                gap: 4,
                padding: "12px 18px",
                background: sel ? "var(--bg-2)" : "transparent",
                borderLeft: "2px solid " + (sel ? "var(--ink)" : "transparent"),
                borderBottom: "1px solid var(--line)",
                textDecoration: "none",
                color: "inherit",
              }}
            >
              <div
                style={{
                  fontFamily: "var(--sans)",
                  fontSize: 13,
                  color: "var(--ink)",
                }}
              >
                {p.title}
              </div>
              <div
                style={{
                  fontSize: 10,
                  color: "var(--ink-4)",
                  display: "flex",
                  gap: 10,
                }}
              >
                <span>{postDate(p.date)}</span>
                <span>{p.tags.map((t) => "#" + t).join(" ")}</span>
              </div>
            </Link>
          );
        })}

        <div
          style={{
            padding: "14px 18px 6px",
            fontSize: 9,
            color: "var(--ink-4)",
            letterSpacing: "0.12em",
            borderTop: "1px solid var(--line)",
          }}
        >
          // TAGS
        </div>
        <div
          style={{
            padding: "4px 18px 14px",
            display: "flex",
            gap: 6,
            flexWrap: "wrap",
          }}
        >
          {tm.map((t) => (
            <span key={t.name} className="tag mono" style={{ fontSize: 10 }}>
              #{t.name} <span style={{ color: "var(--ink-4)" }}>{t.count}</span>
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

type Filter = "all" | PostStatus;

const MOBILE_FILTERS: { id: Filter; label: string }[] = [
  { id: "all", label: "all" },
  { id: "published", label: "published" },
  { id: "draft", label: "drafts" },
  { id: "scheduled", label: "sched" },
];

export function MobileAdmin({
  theme,
  rows,
  activeFilter = "all",
}: BaseProps & { rows: AdminPostRow[]; activeFilter?: Filter }) {
  const list = rows;
  const stats = {
    total: rows.length,
    drafts: rows.filter((r) => r.status === "draft").length,
    published: rows.filter((r) => r.status === "published").length,
  };
  return (
    <div className="blog-frame" data-theme={theme}>
      <header
        style={{
          padding: "14px 18px",
          borderBottom: "1px dashed var(--line-2)",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <div>
          <div
            className="mono"
            style={{
              fontSize: 12,
              color: "var(--ink)",
              display: "flex",
              alignItems: "center",
              gap: 6,
            }}
          >
            <span style={{ color: "var(--ink-3)" }}>~</span>
            <span style={{ color: "var(--ink-4)" }}>$</span>
            <span style={{ fontWeight: 600 }}>./_admin</span>
          </div>
          <div
            className="mono"
            style={{
              fontSize: 10,
              color: "var(--ink-4)",
              marginTop: 4,
              display: "flex",
              alignItems: "center",
              gap: 6,
            }}
          >
            <span
              style={{ width: 5, height: 5, background: "var(--ink)", borderRadius: 999 }}
            />
            @notypiedev
          </div>
        </div>
        <Link
          href="/admin/new"
          style={{
            height: 30,
            padding: "0 12px",
            background: "var(--ink)",
            color: "var(--bg)",
            border: "1px solid var(--ink)",
            fontFamily: "var(--mono)",
            fontSize: 11,
            cursor: "pointer",
            display: "inline-flex",
            alignItems: "center",
            gap: 6,
            textDecoration: "none",
          }}
        >
          + new
        </Link>
      </header>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(3, 1fr)",
          borderBottom: "1px solid var(--line)",
        }}
      >
        {[
          { k: "total", v: String(stats.total) },
          { k: "drafts", v: String(stats.drafts) },
          { k: "live", v: String(stats.published) },
        ].map((s, i) => (
          <div
            key={i}
            style={{
              padding: "14px 16px",
              borderRight: i < 2 ? "1px solid var(--line)" : "none",
            }}
          >
            <div
              className="mono"
              style={{
                fontSize: 9,
                color: "var(--ink-4)",
                letterSpacing: "0.1em",
                textTransform: "uppercase",
              }}
            >
              {s.k}
            </div>
            <div
              style={{
                fontSize: 20,
                fontWeight: 600,
                letterSpacing: "-0.02em",
                color: "var(--ink)",
                marginTop: 4,
              }}
            >
              {s.v}
            </div>
          </div>
        ))}
      </div>

      <div
        className="mono"
        style={{
          display: "flex",
          fontSize: 11,
          padding: "0 18px",
          borderBottom: "1px solid var(--line)",
          background: "var(--bg-1)",
        }}
      >
        {MOBILE_FILTERS.map((f) => {
          const isActive = f.id === activeFilter;
          const href = f.id === "all" ? "/admin" : `/admin?status=${f.id}`;
          return (
            <Link
              key={f.id}
              href={href}
              style={{
                padding: "10px 12px",
                color: isActive ? "var(--ink)" : "var(--ink-3)",
                background: isActive ? "var(--bg)" : "transparent",
                borderBottom: "2px solid " + (isActive ? "var(--ink)" : "transparent"),
                marginBottom: -1,
                cursor: "pointer",
                textDecoration: "none",
              }}
            >
              {f.label}
            </Link>
          );
        })}
      </div>

      <div>
        {list.length === 0 && (
          <div
            className="mono"
            style={{
              padding: "28px 18px",
              fontSize: 12,
              color: "var(--ink-4)",
              textAlign: "center",
            }}
          >
            // no posts
          </div>
        )}
        {list.map((r, i) => (
          <Link
            key={r.id}
            href={`/admin/edit/${encodeURIComponent(r.id)}`}
            style={{
              padding: "14px 18px",
              borderBottom: i < list.length - 1 ? "1px solid var(--line)" : "none",
              display: "flex",
              flexDirection: "column",
              gap: 6,
              textDecoration: "none",
              color: "inherit",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <StatusBadge status={r.status} />
              <span
                className="mono"
                style={{
                  fontSize: 10,
                  color: "var(--ink-4)",
                  marginLeft: "auto",
                }}
              >
                {formatRelative(r.updatedAt)}
              </span>
            </div>
            <div
              style={{
                fontSize: 13,
                color: "var(--ink)",
                fontWeight: 500,
                letterSpacing: "-0.005em",
                lineHeight: 1.4,
              }}
            >
              {r.title}
            </div>
            <div
              className="mono"
              style={{
                fontSize: 10,
                color: "var(--ink-3)",
                display: "flex",
                alignItems: "center",
                gap: 10,
              }}
            >
              <span>/{r.id}.md</span>
              <span style={{ marginLeft: "auto", color: "var(--ink)" }}>edit →</span>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
