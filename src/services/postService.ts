import { ApiError, apiClient, type QueryParams } from "@/api/client";
import { adminEndpoints, endpoints } from "@/api/endpoints";
import type { PaginatedResponse, Post, PostAdmin, PostKind, PostNavResponse, PostStatus } from "@/types";

/**
 * ISR window for public post reads. Threaded into each fetch's `next` directive so the
 * server-side Data Cache actually serves repeat requests within the window (the route-level
 * `export const revalidate` alone does not cache the underlying fetch). Tagged so an admin
 * mutation can `revalidateTag(POSTS_CACHE_TAG)` to invalidate everything at once.
 */
export const POSTS_REVALIDATE_SECONDS = 60;
export const POSTS_CACHE_TAG = "posts";

const PUBLIC_READ_CACHE = {
  next: { revalidate: POSTS_REVALIDATE_SECONDS, tags: [POSTS_CACHE_TAG] },
};

export interface ListPostsParams extends QueryParams {
  page?: number;
  pageSize?: number;
  tag?: string;
  kind?: string;
}

export interface SearchPostsParams extends QueryParams {
  q: string;
  page?: number;
  pageSize?: number;
}

export interface AdminListPostsParams extends ListPostsParams {
  status?: PostStatus | "all";
}

export interface PostMutationPayload {
  id?: string;
  title?: string;
  excerpt?: string;
  tags?: string[];
  date?: string;
  kind?: PostKind;
  content?: string;
  status?: PostStatus;
  readTime?: string;
}

/**
 * Admin mutation requests go through Next route handlers under `/api/admin/*`,
 * which read the httpOnly cookie and forward to the BE with `Authorization`.
 * This module is safe to import from client components — it never references
 * `next/headers`. Server components that need admin data should use
 * `@/server/serverPostService` instead.
 */
async function clientAdminRequest<T>(
  path: string,
  init: RequestInit & { params?: QueryParams } = {},
): Promise<T> {
  const { params, headers, ...rest } = init;
  let url = path;
  if (params) {
    const usp = new URLSearchParams();
    Object.entries(params).forEach(([k, v]) => {
      if (v !== undefined && v !== null && v !== "") usp.set(k, String(v));
    });
    const qs = usp.toString();
    if (qs) url = `${path}?${qs}`;
  }

  const response = await fetch(url, {
    ...rest,
    headers: {
      "Content-Type": "application/json",
      ...headers,
    },
    credentials: "same-origin",
  });

  const ct = response.headers.get("content-type") ?? "";
  const isJson = ct.includes("application/json");
  const body =
    response.status === 204 ? null : isJson ? await response.json() : await response.text();

  if (!response.ok) {
    throw new ApiError(response.statusText, response.status, body);
  }
  return body as T;
}

export const postService = {
  list(params: ListPostsParams = {}) {
    return apiClient.get<PaginatedResponse<Post>>(endpoints.posts.list, {
      params,
      ...PUBLIC_READ_CACHE,
    });
  },
  search(params: SearchPostsParams, signal?: AbortSignal) {
    // No cache directive: search is interactive and runs client-side.
    return apiClient.get<PaginatedResponse<Post>>(endpoints.search, { params, signal });
  },
  detail(id: string) {
    return apiClient.get<Post>(endpoints.posts.detail(id), { ...PUBLIC_READ_CACHE });
  },
  nav(id: string) {
    return apiClient.get<PostNavResponse>(endpoints.posts.nav(id), { ...PUBLIC_READ_CACHE });
  },
  adminList(params: AdminListPostsParams = {}) {
    return clientAdminRequest<PaginatedResponse<PostAdmin>>(adminEndpoints.posts.list, { params });
  },
  adminDetail(id: string) {
    return clientAdminRequest<PostAdmin>(adminEndpoints.posts.detail(id));
  },
  create(payload: PostMutationPayload) {
    return clientAdminRequest<PostAdmin>(adminEndpoints.posts.list, {
      method: "POST",
      body: JSON.stringify(payload),
    });
  },
  update(id: string, payload: PostMutationPayload) {
    return clientAdminRequest<PostAdmin>(adminEndpoints.posts.detail(id), {
      method: "PATCH",
      body: JSON.stringify(payload),
    });
  },
  remove(id: string) {
    return clientAdminRequest<void>(adminEndpoints.posts.detail(id), { method: "DELETE" });
  },
  publish(id: string) {
    return clientAdminRequest<PostAdmin>(adminEndpoints.posts.publish(id), { method: "POST" });
  },
};
