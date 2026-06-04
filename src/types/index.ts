export type Theme = "dark" | "light";

export type PostKind = "essay" | "note" | "guide" | "compare";

export type PostStatus = "published" | "draft" | "scheduled";

export interface Post {
  id: string;
  title: string;
  excerpt: string;
  tags: string[];
  date: string;
  readTime: string;
  kind: PostKind;
  featured?: boolean;
  status?: PostStatus;
  views?: number;
  content?: string;
}

export interface PostAdmin extends Post {
  status: PostStatus;
  views: number;
  content: string;
  createdAt: string;
  updatedAt: string;
}

export interface Tag {
  name: string;
  count: number;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  hasNext: boolean;
}

export type AdminPostRow = Pick<
  PostAdmin,
  "id" | "title" | "status" | "kind" | "tags" | "views" | "updatedAt"
>;

export interface PostNavItem {
  id: string;
  title: string;
  excerpt: string;
  date: string;
  tags: string[];
}

export interface PostNavResponse {
  prev: PostNavItem | null;
  next: PostNavItem | null;
}
