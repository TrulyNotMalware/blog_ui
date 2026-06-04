"use client";

import { useQuery } from "@tanstack/react-query";
import { postService, type ListPostsParams } from "@/services/postService";
import { queryKeys } from "./queryKeys";

export function usePostsQuery(params: ListPostsParams = {}) {
  return useQuery({
    queryKey: queryKeys.posts.list(params),
    queryFn: () => postService.list(params),
  });
}

export function usePostQuery(id: string) {
  return useQuery({
    queryKey: queryKeys.posts.detail(id),
    queryFn: () => postService.detail(id),
    enabled: Boolean(id),
  });
}
