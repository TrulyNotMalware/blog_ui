import type { ListPostsParams } from "@/services/postService";

export const queryKeys = {
  posts: {
    all: ["posts"] as const,
    list: (params?: ListPostsParams) =>
      [...queryKeys.posts.all, "list", params ?? {}] as const,
    detail: (id: string) => [...queryKeys.posts.all, "detail", id] as const,
  },
  tags: {
    all: ["tags"] as const,
    list: () => [...queryKeys.tags.all, "list"] as const,
    detail: (name: string) => [...queryKeys.tags.all, "detail", name] as const,
  },
} as const;
