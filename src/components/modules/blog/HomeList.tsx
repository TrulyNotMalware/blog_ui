import { Footer } from "@/components/layout/Footer";
import { Intro } from "@/components/layout/Intro";
import { Nav } from "@/components/layout/Nav";
import { Toolbar } from "@/components/layout/Toolbar";
import type { Post, Theme } from "@/types";
import { PostRow } from "./Cards";
import { Pagination } from "./HomeCards";

interface Props {
  posts: Post[];
  page: number;
  totalPages: number;
  theme?: Theme;
}

export function HomeList({ theme, posts, page, totalPages }: Props) {
  return (
    <div className="blog-frame" data-theme={theme}>
      <Nav active="home" />
      <div style={{ padding: "32px 48px 0" }}>
        <Intro />
        <Toolbar view="list" />

        <section style={{ marginBottom: 28 }}>
          {posts.map((p, i, arr) => (
            <PostRow key={p.id} post={p} lastInGroup={i === arr.length - 1} />
          ))}
        </section>

        <Pagination page={page} totalPages={totalPages} />
      </div>
      <Footer />
    </div>
  );
}
