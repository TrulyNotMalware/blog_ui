import { cache, Suspense } from "react";
import GithubSlugger from "github-slugger";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ApiError } from "@/api/client";
import { APP_NAME } from "@/constants";
import { ResponsiveSwitch } from "@/components/layout/ResponsiveSwitch";
import { PostNavStrip, PostView } from "@/components/modules/blog/Post";
import { MarkdownContent } from "@/components/modules/blog/MarkdownContent";
import { MobilePost, MobilePostNavStrip } from "@/components/modules/mobile/Mobile";
import { postService } from "@/services/postService";
import { serverPostService } from "@/server/serverPostService";

const TOC_HEADING_RE = /^## (.+)$/gm;
const TOC_SLUG_PREFIX = "md-";

export const revalidate = 60;

interface PageProps {
  params: Promise<{ id: string }>;
}

const getPostDetail = cache((id: string) => postService.detail(id));

const STATIC_PARAMS_PAGE_SIZE = 100;
const STATIC_PARAMS_MAX_PAGES = 100;
const STATIC_PARAMS_CONCURRENCY = 5;

export async function generateStaticParams(): Promise<{ id: string }[]> {
  // Build-time pre-rendering must not hard-depend on the live API. If ANY page of the
  // listing is unreachable during the build, pre-render nothing (return []) and let every
  // detail page render on demand at runtime (dynamicParams defaults to true). A *partial*
  // list would be worse than []: Next would still prerender those ids, and each detail
  // page re-fetches the API — reintroducing the very build-time dependency we're avoiding.
  try {
    const first = await postService.list({ page: 1, pageSize: STATIC_PARAMS_PAGE_SIZE });
    const out: { id: string }[] = first.items.map((p) => ({ id: p.id }));
    if (!first.hasNext) return out;

    const totalPages = Math.min(
      Math.ceil(first.total / STATIC_PARAMS_PAGE_SIZE),
      STATIC_PARAMS_MAX_PAGES,
    );
    // Page 1's `total` already tells us every remaining page, so fire them all through a
    // worker pool of fixed size instead of serial batches. A batch loop stalls on the
    // slowest response per batch; the pool only ever waits on the slowest response per
    // free slot, while still capping concurrent BE fetches during `next build`.
    const pages = Array.from({ length: totalPages - 1 }, (_, i) => i + 2);
    let cursor = 0;
    let failed = false;
    // Each worker catches its own fetch errors so Promise.all never rejects mid-flight
    // (which would return `out` while sibling workers keep mutating it). We await every
    // worker, then decide all-or-nothing from the shared `failed` flag.
    async function worker(): Promise<void> {
      while (cursor < pages.length && !failed) {
        const page = pages[cursor++];
        try {
          const res = await postService.list({ page, pageSize: STATIC_PARAMS_PAGE_SIZE });
          for (const p of res.items) out.push({ id: p.id });
        } catch {
          failed = true;
        }
      }
    }
    await Promise.all(
      Array.from({ length: Math.min(STATIC_PARAMS_CONCURRENCY, pages.length) }, () => worker()),
    );
    return failed ? [] : out;
  } catch {
    // Page-1 fetch failed → pre-render nothing; detail pages render on demand at runtime.
    return [];
  }
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params;
  try {
    const post = await getPostDetail(id);
    const canonical = `/posts/${encodeURIComponent(post.id)}`;
    return {
      title: post.title,
      description: post.excerpt,
      alternates: { canonical },
      openGraph: {
        type: "article",
        siteName: APP_NAME,
        locale: "ko_KR",
        title: post.title,
        description: post.excerpt,
        url: canonical,
        publishedTime: post.date,
        tags: post.tags,
      },
      twitter: {
        card: "summary_large_image",
        title: post.title,
        description: post.excerpt,
        images: [`${canonical}/opengraph-image`],
      },
    };
  } catch {
    return { title: "Not found" };
  }
}

// React.cache dedups the slug walk between metadata + page render in the same
// request. Each invocation still gets a fresh GithubSlugger so duplicate-heading
// suffixes ("-1", "-2") match rehype-slug's per-document state.
export const extractToc = cache(function extractToc(source: string) {
  const slugger = new GithubSlugger();
  return [...source.matchAll(TOC_HEADING_RE)].map((m, i) => {
    const text = m[1];
    return {
      n: String(i + 1).padStart(2, "0"),
      text,
      slug: `${TOC_SLUG_PREFIX}${slugger.slug(text)}`,
    };
  });
});

interface NavLink {
  id: string;
  title: string;
}

const resolveNav = cache(async function resolveNav(
  postId: string,
): Promise<{ prev?: NavLink; next?: NavLink }> {
  const nav = await serverPostService.nav(postId);
  return {
    prev: nav.prev ?? undefined,
    next: nav.next ?? undefined,
  };
});

// Each strip awaits the (cached) nav fetch independently. Rendered inside a Suspense
// boundary so the article body streams immediately and only the prev/next strip waits.
async function DesktopNav({ id }: { id: string }) {
  const { prev, next } = await resolveNav(id);
  return <PostNavStrip prev={prev} next={next} />;
}

async function MobileNav({ id }: { id: string }) {
  const { prev, next } = await resolveNav(id);
  return <MobilePostNavStrip prev={prev} next={next} />;
}

export default async function PostPage({ params }: PageProps) {
  const { id } = await params;

  let post: Awaited<ReturnType<typeof getPostDetail>>;
  try {
    post = await getPostDetail(id);
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) notFound();
    throw error;
  }

  const source = post.content ?? "";
  const toc = extractToc(source);
  const body = <MarkdownContent source={source} />;

  return (
    <ResponsiveSwitch
      desktop={
        <PostView
          post={post}
          toc={toc}
          nav={
            <Suspense fallback={null}>
              <DesktopNav id={id} />
            </Suspense>
          }
        >
          {body}
        </PostView>
      }
      mobile={
        <MobilePost
          post={post}
          nav={
            <Suspense fallback={null}>
              <MobileNav id={id} />
            </Suspense>
          }
        >
          {body}
        </MobilePost>
      }
    />
  );
}
