import Link from "next/link";
import type { ReactNode } from "react";
import { LogoutButton } from "@/components/modules/admin/LogoutButton";
import { ThemeToggle } from "@/components/layout/ThemeToggle";
import type { PostStatus, Theme } from "@/types";

export type AdminTab = "posts" | "drafts" | "tags";

interface ShellProps {
  tab?: AdminTab;
  theme?: Theme;
  counts?: Partial<Record<AdminTab, number>>;
  children?: ReactNode;
}

const DEFAULT_COUNTS: Record<AdminTab, number | null> = {
  posts: 12,
  drafts: 2,
  tags: 12,
} as Record<AdminTab, number | null>;

export function AdminShell({ tab = "posts", theme, counts, children }: ShellProps) {
  const c = { ...DEFAULT_COUNTS, ...counts };
  return (
    <div className="blog-frame" data-theme={theme}>
      <header
        style={{
          padding: "20px 36px 18px",
          display: "flex",
          alignItems: "flex-end",
          justifyContent: "space-between",
          borderBottom: "1px dashed var(--line-2)",
        }}
      >
        <div>
          <div
            className="mono"
            style={{
              fontSize: 13,
              color: "var(--ink)",
              display: "flex",
              alignItems: "center",
              gap: 8,
            }}
          >
            <span style={{ color: "var(--ink-3)" }}>~</span>
            <span style={{ color: "var(--ink-4)" }}>$</span>
            <span style={{ fontWeight: 600 }}>cd ./notypiedev/_admin</span>
          </div>
          <div
            className="mono"
            style={{
              fontSize: 11,
              color: "var(--ink-4)",
              marginTop: 6,
              display: "flex",
              alignItems: "center",
              gap: 10,
            }}
          >
            <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
              <span
                style={{ width: 6, height: 6, background: "var(--ink)", borderRadius: 999 }}
              />
              admin · signed in as @notypiedev
            </span>
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <Link
            className="mono"
            href="/"
            style={{ fontSize: 11, color: "var(--ink-3)", textDecoration: "none" }}
          >
            ← back to /blog
          </Link>
          <Link
            href="/admin/new"
            style={{
              height: 30,
              padding: "0 14px",
              background: "var(--ink)",
              color: "var(--bg)",
              border: "1px solid var(--ink)",
              fontFamily: "var(--mono)",
              fontSize: 12,
              cursor: "pointer",
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
              textDecoration: "none",
            }}
          >
            <span>+</span> new post
            <span
              className="kbd"
              style={{
                background: "transparent",
                border: "1px solid var(--ink-3)",
                color: "var(--bg)",
                opacity: 0.8,
              }}
            >
              N
            </span>
          </Link>
          <LogoutButton />
          <ThemeToggle />
        </div>
      </header>

      <nav
        className="mono"
        style={{
          padding: "0 36px",
          display: "flex",
          alignItems: "center",
          gap: 0,
          borderBottom: "1px solid var(--line)",
          background: "var(--bg-1)",
        }}
      >
        {(["posts", "drafts", "tags"] as AdminTab[]).map((id) => (
          <Link
            key={id}
            href={id === "posts" ? "/admin" : `/admin/${id}`}
            style={{
              padding: "12px 16px",
              fontSize: 12,
              color: id === tab ? "var(--ink)" : "var(--ink-3)",
              background: id === tab ? "var(--bg)" : "transparent",
              borderRight: "1px solid var(--line)",
              borderBottom: "2px solid " + (id === tab ? "var(--ink)" : "transparent"),
              marginBottom: -1,
              textDecoration: "none",
              cursor: "pointer",
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
            }}
          >
            <span>{id}</span>
            {c[id] !== null && c[id] !== undefined && (
              <span style={{ color: "var(--ink-4)", fontSize: 11 }}>({c[id]})</span>
            )}
          </Link>
        ))}
        <span
          style={{
            marginLeft: "auto",
            fontSize: 11,
            color: "var(--ink-4)",
            padding: "12px 0",
            display: "flex",
            alignItems: "center",
            gap: 14,
          }}
        >
          <span>branch: main</span>
          <span>·</span>
          <span>↑ deployed 14m ago</span>
          <span>·</span>
          <span
            style={{
              color: "var(--ink-2)",
              display: "inline-flex",
              alignItems: "center",
              gap: 5,
            }}
          >
            <span
              style={{ width: 6, height: 6, background: "#5eb874", borderRadius: 999 }}
            />
            live
          </span>
        </span>
      </nav>

      {children}
    </div>
  );
}

export function StatusBadge({ status }: { status: PostStatus }) {
  const map: Record<PostStatus, { label: string; color: string }> = {
    published: { label: "● published", color: "var(--ink)" },
    draft: { label: "○ draft", color: "var(--ink-3)" },
    scheduled: { label: "◐ scheduled", color: "var(--ink-2)" },
  };
  const s = map[status];
  return (
    <span
      className="mono"
      style={{ fontSize: 11, color: s.color, letterSpacing: "0.02em" }}
    >
      {s.label}
    </span>
  );
}
