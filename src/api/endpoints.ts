export const endpoints = {
  posts: {
    list: "posts",
    detail: (id: string) => `posts/${id}`,
    nav: (id: string) => `posts/${id}/nav`,
  },
  tags: {
    list: "tags",
    detail: (name: string) => `tags/${name}`,
  },
  content: {
    detail: (key: string) => `content/${key}`,
  },
  search: "search",
} as const;

// Internal Next.js route handler paths (browser → Next server proxy → BE).
// These are absolute paths (start with "/") so the FE fetch hits the local Next server,
// not the BE `API_BASE_URL`.
export const adminEndpoints = {
  login: "/api/admin/auth/login",
  logout: "/api/admin/auth/logout",
  posts: {
    list: "/api/admin/posts",
    detail: (id: string) => `/api/admin/posts/${encodeURIComponent(id)}`,
    publish: (id: string) => `/api/admin/posts/${encodeURIComponent(id)}/publish`,
  },
  content: {
    detail: (key: string) => `/api/admin/content/${encodeURIComponent(key)}`,
  },
} as const;
