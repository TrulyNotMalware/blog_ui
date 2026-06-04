import Link from "next/link";
import { Footer } from "@/components/layout/Footer";
import { Intro } from "@/components/layout/Intro";
import { Nav } from "@/components/layout/Nav";
import { Toolbar } from "@/components/layout/Toolbar";
import type { Post, Theme } from "@/types";
import { FeaturedCard, PostCard } from "./Cards";

interface Props {
  posts: Post[];
  page: number;
  totalPages: number;
  theme?: Theme;
}

export function HomeCards({ theme, posts, page, totalPages }: Props) {
  const featured = posts[0];
  const rest = posts.slice(1, 10);

  return (
    <div className="blog-frame" data-theme={theme}>
      <Nav active="home" />
      <div style={{ padding: "32px 48px 0" }}>
        <Intro />
        <Toolbar view="cards" />

        {featured && <FeaturedCard post={featured} />}

        <div
          className="mono"
          style={{
            fontSize: 11,
            color: "var(--ink-4)",
            letterSpacing: "0.1em",
            marginBottom: 14,
            display: "flex",
            alignItems: "center",
            gap: 12,
          }}
        >
          <span>── recent ──</span>
          <span style={{ flex: 1, borderTop: "1px dashed var(--line)" }} />
          <span>
            {posts.length} posts · page {page} of {totalPages}
          </span>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16 }}>
          {rest.map((p) => (
            <PostCard key={p.id} post={p} />
          ))}
        </div>

        <Pagination page={page} totalPages={totalPages} />
      </div>
      <Footer />
    </div>
  );
}

interface PaginationProps {
  page: number;
  totalPages: number;
  basePath?: string;
}

function paginationLinkStyle(active: boolean, muted = false) {
  return {
    padding: active ? "4px 10px" : "4px 8px",
    background: active ? "var(--bg-2)" : "transparent",
    border: "1px solid " + (active ? "var(--line-2)" : "transparent"),
    color: active ? "var(--ink)" : muted ? "var(--ink-4)" : "var(--ink-3)",
    textDecoration: "none",
  };
}

export function Pagination({ page, totalPages, basePath = "/" }: PaginationProps) {
  const linkFor = (n: number) => (n <= 1 ? basePath : `${basePath}?page=${n}`);
  const prevPage = Math.max(1, page - 1);
  const nextPage = Math.min(totalPages, page + 1);

  return (
    <nav
      aria-label="pagination"
      className="mono"
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: 4,
        padding: "28px 0 20px",
        fontSize: 12,
      }}
    >
      <Link
        href={linkFor(prevPage)}
        aria-disabled={page === 1}
        style={paginationLinkStyle(false, page === 1)}
      >
        ← prev
      </Link>
      {Array.from({ length: totalPages }, (_, i) => i + 1).map((n) => (
        <Link key={n} href={linkFor(n)} style={paginationLinkStyle(n === page)}>
          {n.toString().padStart(2, "0")}
        </Link>
      ))}
      <Link
        href={linkFor(nextPage)}
        aria-disabled={page === totalPages}
        style={paginationLinkStyle(false, page === totalPages)}
      >
        next →
      </Link>
    </nav>
  );
}
