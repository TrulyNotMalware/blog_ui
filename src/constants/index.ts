export const APP_NAME = "Notypiedev";
export const APP_DESCRIPTION = "Notypiedev — 개발과 기록";

export const ROUTES = {
  HOME: "/",
  POSTS: "/posts",
  POST_DETAIL: (slug: string) => `/posts/${slug}`,
  TAGS: "/tags",
  TAG_DETAIL: (slug: string) => `/tags/${slug}`,
  ABOUT: "/about",
} as const;

export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:3000/api";

export const SITE_URL = (
  process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"
).replace(/\/+$/, "");

export const PAGINATION = {
  DEFAULT_PAGE_SIZE: 10,
} as const;
