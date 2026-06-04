import type { MetadataRoute } from "next";
import { SITE_URL } from "@/constants";
import { postService } from "@/services/postService";
import { tagService } from "@/services/tagService";
import { buildSitemap } from "@/utils/seo";
import type { Post } from "@/types";

export const revalidate = 300;

// BE caps pageSize at 100. Paginate so we don't silently drop posts past page 1.
const PAGE_SIZE = 100;
const MAX_PAGES = 100;

async function fetchAllPosts(): Promise<Post[]> {
  const items: Post[] = [];
  for (let page = 1; page <= MAX_PAGES; page++) {
    const res = await postService.list({ page, pageSize: PAGE_SIZE });
    items.push(...res.items);
    if (!res.hasNext) return items;
  }
  return items;
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [postsResult, tagsResult] = await Promise.allSettled([
    fetchAllPosts(),
    tagService.list(),
  ]);

  if (postsResult.status === "rejected") {
    console.error("[sitemap] failed to fetch posts", postsResult.reason);
  }
  if (tagsResult.status === "rejected") {
    console.error("[sitemap] failed to fetch tags", tagsResult.reason);
  }

  const posts = postsResult.status === "fulfilled" ? postsResult.value : [];
  const tags = tagsResult.status === "fulfilled" ? tagsResult.value : [];

  return buildSitemap({ siteUrl: SITE_URL, posts, tags });
}
