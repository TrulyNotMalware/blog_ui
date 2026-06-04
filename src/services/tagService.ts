import { apiClient } from "@/api/client";
import { endpoints } from "@/api/endpoints";
import { POSTS_CACHE_TAG, POSTS_REVALIDATE_SECONDS } from "@/services/postService";
import type { Post, Tag } from "@/types";

export interface TagDetail {
  tag: Tag;
  posts: Post[];
}

// Tag lists/counts are derived from posts, so they share the `posts` cache tag: a post
// mutation's revalidateTag('posts', …) invalidates these reads too, keeping /tags
// consistent with the post pages instead of drifting until the route's own window elapses.
const PUBLIC_READ_CACHE = {
  next: { revalidate: POSTS_REVALIDATE_SECONDS, tags: [POSTS_CACHE_TAG] },
};

export const tagService = {
  list() {
    return apiClient.get<Tag[]>(endpoints.tags.list, { ...PUBLIC_READ_CACHE });
  },
  detail(name: string) {
    return apiClient.get<TagDetail>(endpoints.tags.detail(name), { ...PUBLIC_READ_CACHE });
  },
};
