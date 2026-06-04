"use client";

import { useQuery } from "@tanstack/react-query";
import { tagService } from "@/services/tagService";
import { queryKeys } from "./queryKeys";

export function useTagsQuery(options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: queryKeys.tags.list(),
    queryFn: () => tagService.list(),
    enabled: options?.enabled ?? true,
  });
}

export function useTagDetailQuery(name: string) {
  return useQuery({
    queryKey: queryKeys.tags.detail(name),
    queryFn: () => tagService.detail(name),
    enabled: Boolean(name),
  });
}
