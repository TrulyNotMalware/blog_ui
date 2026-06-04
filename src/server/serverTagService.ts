import "server-only";

import { cache } from "react";
import { apiClient } from "@/api/client";
import { endpoints } from "@/api/endpoints";
import type { Post, Tag } from "@/types";

export interface TagDetail {
  tag: Tag;
  posts: Post[];
}

export const serverTagService = {
  list: cache((): Promise<Tag[]> => apiClient.get<Tag[]>(endpoints.tags.list)),
  detail: cache((name: string): Promise<TagDetail> =>
    apiClient.get<TagDetail>(endpoints.tags.detail(name)),
  ),
};
