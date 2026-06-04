import Link from "next/link";
import type { AdminPostRow, PostStatus, Theme } from "@/types";
import { formatRelative } from "@/utils/relative";
import { AdminShell, StatusBadge } from "./Shell";
import type { AdminTab } from "./Shell";

type Filter = "all" | PostStatus;

interface Props {
  rows: AdminPostRow[];
  total: number;
  theme?: Theme;
  activeFilter?: Filter;
  shellTab?: AdminTab;
}

const FILTERS: { id: Filter; label: string }[] = [
  { id: "all", label: "all" },
  { id: "published", label: "published" },
  { id: "draft", label: "drafts" },
  { id: "scheduled", label: "scheduled" },
];

export function AdminPosts({ theme, rows, total, activeFilter = "all", shellTab = "posts" }: Props) {
  let published = 0;
  let drafts = 0;
  let scheduled = 0;
  for (const r of rows) {
    if (r.status === "published") published++;
    else if (r.status === "draft") drafts++;
    else if (r.status === "scheduled") scheduled++;
  }
  const counts = { total, published, drafts, scheduled };
  const lastUpdated = rows[0];
  const lastUpdatedLabel = lastUpdated
    ? `${formatRelative(lastUpdated.updatedAt)} · ${lastUpdated.title}`
    : "—";

  const shellCounts = shellTab === "drafts"
    ? { drafts: total }
    : { posts: total, drafts: counts.drafts };

  return (
    <AdminShell tab={shellTab} theme={theme} counts={shellCounts}>
      <section
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(4, 1fr)",
          borderBottom: "1px solid var(--line)",
        }}
      >
        {[
          { k: "total", v: String(counts.total), sub: "posts" },
          { k: "published", v: String(counts.published), sub: "live" },
          { k: "drafts", v: String(counts.drafts), sub: "awaiting publish" },
          {
            k: "last updated",
            v: lastUpdated ? formatRelative(lastUpdated.updatedAt) : "—",
            sub: lastUpdated?.title ?? "—",
          },
        ].map((s, i) => (
          <div
            key={i}
            style={{
              padding: "20px 28px",
              borderRight: i < 3 ? "1px solid var(--line)" : "none",
            }}
          >
            <div
              className="mono"
              style={{
                fontSize: 10,
                color: "var(--ink-4)",
                letterSpacing: "0.12em",
                marginBottom: 8,
                textTransform: "uppercase",
              }}
            >
              // {s.k}
            </div>
            <div
              style={{
                fontSize: 26,
                fontWeight: 600,
                letterSpacing: "-0.02em",
                color: "var(--ink)",
                lineHeight: 1,
              }}
            >
              {s.v}
            </div>
            <div
              className="mono"
              style={{
                fontSize: 11,
                color: "var(--ink-3)",
                marginTop: 6,
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            >
              {s.sub}
            </div>
          </div>
        ))}
      </section>

      <div
        style={{
          padding: "20px 36px 12px",
          display: "flex",
          alignItems: "center",
          gap: 12,
        }}
      >
        <div
          className="mono"
          style={{
            flex: 1,
            display: "flex",
            alignItems: "center",
            gap: 10,
            padding: "10px 14px",
            border: "1px solid var(--line-2)",
            background: "var(--bg-1)",
            fontSize: 13,
          }}
        >
          <span style={{ color: "var(--ink-3)" }}>$</span>
          <span style={{ color: "var(--ink-3)" }}>find ./posts -name &quot;</span>
          <span style={{ color: "var(--ink)" }}>*</span>
          <span style={{ color: "var(--ink-3)" }}>.md&quot;</span>
          <span style={{ marginLeft: "auto", color: "var(--ink-4)" }}>
            {rows.length} results
          </span>
        </div>
        <div
          className="mono"
          style={{
            display: "flex",
            fontSize: 12,
            border: "1px solid var(--line-2)",
            background: "var(--bg-1)",
          }}
        >
          {FILTERS.map((f, i) => {
            const isActive = f.id === activeFilter;
            const href = f.id === "all" ? "/admin" : `/admin?status=${f.id}`;
            return (
              <Link
                key={f.id}
                href={href}
                style={{
                  padding: "8px 12px",
                  color: isActive ? "var(--ink)" : "var(--ink-3)",
                  background: isActive ? "var(--bg-2)" : "transparent",
                  borderRight: i < FILTERS.length - 1 ? "1px solid var(--line-2)" : "none",
                  cursor: "pointer",
                  textDecoration: "none",
                }}
              >
                {f.label}
              </Link>
            );
          })}
        </div>
      </div>

      <div style={{ padding: "0 36px" }}>
        <div
          className="mono"
          style={{
            display: "grid",
            gridTemplateColumns: "110px 1fr 100px 130px 70px 90px 70px",
            gap: 16,
            padding: "10px 12px",
            fontSize: 10,
            color: "var(--ink-4)",
            letterSpacing: "0.12em",
            textTransform: "uppercase",
            borderBottom: "1px solid var(--line)",
          }}
        >
          <span>status</span>
          <span>title</span>
          <span>kind</span>
          <span>tags</span>
          <span>views</span>
          <span>edited</span>
          <span style={{ textAlign: "right" }}>actions</span>
        </div>
        {rows.length === 0 && (
          <div
            className="mono"
            style={{
              padding: "28px 12px",
              fontSize: 12,
              color: "var(--ink-4)",
              textAlign: "center",
            }}
          >
            // no posts
          </div>
        )}
        {rows.map((r) => (
          <Link
            key={r.id}
            href={`/admin/edit/${encodeURIComponent(r.id)}`}
            style={{
              display: "grid",
              gridTemplateColumns: "110px 1fr 100px 130px 70px 90px 70px",
              gap: 16,
              padding: "14px 12px",
              alignItems: "center",
              borderBottom: "1px solid var(--line)",
              cursor: "pointer",
              textDecoration: "none",
              color: "inherit",
            }}
          >
            <StatusBadge status={r.status} />
            <div>
              <div
                style={{
                  fontSize: 14,
                  color: "var(--ink)",
                  fontWeight: 500,
                  letterSpacing: "-0.005em",
                }}
              >
                {r.title}
              </div>
              <div
                className="mono"
                style={{ fontSize: 11, color: "var(--ink-4)", marginTop: 2 }}
              >
                /{r.id}.md
              </div>
            </div>
            <span
              className="mono"
              style={{
                fontSize: 12,
                color: "var(--ink-3)",
                textTransform: "uppercase",
                letterSpacing: "0.05em",
              }}
            >
              {r.kind}
            </span>
            <span
              className="mono"
              style={{
                fontSize: 11,
                color: "var(--ink-3)",
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            >
              {r.tags.map((t) => "#" + t).join(" ")}
            </span>
            <span
              className="mono"
              style={{
                fontSize: 12,
                color: r.status === "published" ? "var(--ink-2)" : "var(--ink-4)",
              }}
            >
              {r.status === "published" ? r.views.toLocaleString() : "—"}
            </span>
            <span className="mono" style={{ fontSize: 11, color: "var(--ink-4)" }}>
              {formatRelative(r.updatedAt)}
            </span>
            <div
              className="mono"
              style={{
                fontSize: 11,
                color: "var(--ink-3)",
                display: "flex",
                gap: 10,
                justifyContent: "flex-end",
              }}
            >
              <span>edit</span>
              <span style={{ color: "var(--ink-4)" }}>↗</span>
            </div>
          </Link>
        ))}
      </div>

      <div
        className="mono"
        style={{
          padding: "14px 36px",
          borderTop: "1px solid var(--line)",
          background: "var(--bg-1)",
          display: "flex",
          alignItems: "center",
          gap: 18,
          fontSize: 11,
          color: "var(--ink-4)",
        }}
      >
        <span>
          showing {rows.length} of {total}
        </span>
        <span>·</span>
        <span>sorted by updated ↓</span>
        <span>·</span>
        <span title={lastUpdatedLabel}>last: {lastUpdatedLabel}</span>
        <span style={{ marginLeft: "auto", display: "flex", gap: 12 }}>
          <Link
            href="/admin/new"
            style={{
              color: "var(--ink-2)",
              textDecoration: "none",
              display: "inline-flex",
              gap: 6,
              alignItems: "center",
            }}
          >
            <span className="kbd">N</span> new
          </Link>
          <span>
            <span className="kbd">/</span> filter
          </span>
        </span>
      </div>
    </AdminShell>
  );
}
