import Link from "next/link";
import { Footer } from "@/components/layout/Footer";
import { Nav } from "@/components/layout/Nav";
import type { Post, Tag, Theme } from "@/types";
import { PostRow } from "./Cards";

interface Props {
  posts: Post[];
  tags: Tag[];
  selected?: string;
  theme?: Theme;
}

export function Tags({ theme, selected, posts, tags }: Props) {
  const filtered = selected
    ? posts.filter((p) => p.tags.includes(selected))
    : posts;

  return (
    <div className="blog-frame" data-theme={theme}>
      <Nav active="tags" />
      <div style={{ padding: "32px 48px" }}>
        <div className="mono" style={{ fontSize: 12, color: "var(--ink-3)", marginBottom: 8 }}>
          <span style={{ color: "var(--ink-3)" }}>$</span> ls ./tags/
        </div>
        <h1
          className="mono"
          style={{
            fontSize: 22,
            fontWeight: 600,
            margin: "0 0 32px",
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
            gap: 14,
            marginBottom: 40,
            paddingBottom: 32,
            borderBottom: "1px dashed var(--line-2)",
          }}
        >
          {tags.map((t) => {
            const isSel = t.name === selected;
            return (
              <Link
                key={t.name}
                href={`/tags/${t.name}`}
                className="mono tag-chip"
                data-selected={isSel || undefined}
                style={{
                  fontSize: 13,
                  textDecoration: "none",
                  display: "inline-flex",
                  alignItems: "baseline",
                  gap: 6,
                }}
              >
                #{t.name}
                <span style={{ fontSize: 11, color: "inherit", opacity: 0.6 }}>{t.count}</span>
              </Link>
            );
          })}
        </div>

        <div
          className="mono"
          style={{
            fontSize: 12,
            color: "var(--ink-3)",
            marginBottom: 14,
            display: "flex",
            alignItems: "center",
            gap: 8,
          }}
        >
          <span style={{ color: "var(--ink-3)" }}>$</span> ls ./tags/
          {selected ? (
            <>
              <span style={{ color: "var(--ink)" }}>{selected}</span>/
            </>
          ) : null}
          <span style={{ color: "var(--ink-4)" }}>// {filtered.length} files</span>
          <span style={{ marginLeft: "auto", color: "var(--ink-4)" }}>sorted: newest</span>
        </div>

        {/* TODO: paginate when filtered.length > PAGE_LIMIT — currently truncates silently. */}
        {filtered.slice(0, 6).map((p, i, arr) => (
          <PostRow
            key={p.id}
            post={p}
            lastInGroup={i === arr.length - 1}
            highlightTag={selected}
          />
        ))}
        {filtered.length > 6 ? (
          <div
            className="mono"
            style={{
              marginTop: 18,
              fontSize: 11,
              color: "var(--ink-4)",
              textAlign: "right",
            }}
          >
            // showing 6 of {filtered.length}
          </div>
        ) : null}
      </div>
      <Footer />
    </div>
  );
}
