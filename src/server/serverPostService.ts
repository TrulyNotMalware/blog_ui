import "server-only";

import { cache } from "react";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { ApiError, apiClient } from "@/api/client";
import { API_BASE_URL } from "@/constants";
import { endpoints } from "@/api/endpoints";
import { ADMIN_ACCESS_COOKIE } from "@/server/adminProxy";
import type { PaginatedResponse, Post, PostAdmin, PostNavResponse, PostStatus } from "@/types";
import {
  POSTS_CACHE_TAG,
  POSTS_REVALIDATE_SECONDS,
  type ListPostsParams,
} from "@/services/postService";

const PUBLIC_READ_CACHE = {
  next: { revalidate: POSTS_REVALIDATE_SECONDS, tags: [POSTS_CACHE_TAG] },
};

export interface ServerAdminListParams {
  page?: number;
  pageSize?: number;
  tag?: string;
  kind?: string;
  status?: PostStatus;
}

function buildUrl(path: string, params?: Record<string, string | number | undefined>): string {
  const base = API_BASE_URL.endsWith("/") ? API_BASE_URL : `${API_BASE_URL}/`;
  const url = new URL(path.replace(/^\/+/, ""), base);
  if (params) {
    Object.entries(params).forEach(([k, v]) => {
      if (v !== undefined && v !== "") url.searchParams.set(k, String(v));
    });
  }
  return url.toString();
}

async function adminFetch<T>(path: string, params?: Record<string, string | number | undefined>): Promise<T> {
  const store = await cookies();
  const token = store.get(ADMIN_ACCESS_COOKIE)?.value;
  if (!token) {
    redirect("/admin/login");
  }
  const res = await fetch(buildUrl(path, params), {
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    cache: "no-store",
  });
  if (res.status === 401) {
    // RSC render context can't mutate cookies; route handlers clear them via Set-Cookie.
    redirect("/admin/login");
  }
  const ct = res.headers.get("content-type") ?? "";
  const body = ct.includes("application/json") ? await res.json() : await res.text();
  if (!res.ok) throw new ApiError(res.statusText, res.status, body);
  return body as T;
}

// React.cache keys by argument identity. Pass primitives so multiple callers
// with logically equal params actually hit the cache.
const _adminList = cache(
  (
    page: number | undefined,
    pageSize: number | undefined,
    tag: string | undefined,
    kind: string | undefined,
    status: PostStatus | undefined,
  ) => adminFetch<PaginatedResponse<PostAdmin>>("admin/posts", { page, pageSize, tag, kind, status }),
);

const _adminDetail = cache((id: string) =>
  adminFetch<PostAdmin>(`admin/posts/${encodeURIComponent(id)}`),
);

const _list = cache(
  (
    page: number | undefined,
    pageSize: number | undefined,
    tag: string | undefined,
    kind: string | undefined,
  ) =>
    apiClient.get<PaginatedResponse<Post>>(endpoints.posts.list, {
      params: { page, pageSize, tag, kind },
      ...PUBLIC_READ_CACHE,
    }),
);

const _detail = cache((id: string) =>
  apiClient.get<Post>(endpoints.posts.detail(id), { ...PUBLIC_READ_CACHE }),
);

const _nav = cache((id: string) =>
  apiClient.get<PostNavResponse>(endpoints.posts.nav(id), { ...PUBLIC_READ_CACHE }),
);

export const serverPostService = {
  adminList(params: ServerAdminListParams = {}) {
    return _adminList(params.page, params.pageSize, params.tag, params.kind, params.status);
  },
  adminDetail(id: string) {
    return _adminDetail(id);
  },
  list(params: ListPostsParams = {}) {
    return _list(params.page, params.pageSize, params.tag, params.kind);
  },
  detail(id: string) {
    return _detail(id);
  },
  nav(id: string) {
    return _nav(id);
  },
};
