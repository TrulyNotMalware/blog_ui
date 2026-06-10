import "server-only";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { API_BASE_URL } from "@/constants";
import { ApiError } from "@/api/client";
import { ADMIN_ACCESS_COOKIE } from "@/server/adminProxy";
import type { AboutContent, IntroContent } from "@/services/contentService";

interface ContentResponse<T> {
  key: string;
  content: T;
  updatedAt: string;
}

function buildUrl(path: string): string {
  const base = API_BASE_URL.endsWith("/") ? API_BASE_URL : `${API_BASE_URL}/`;
  return new URL(path.replace(/^\/+/, ""), base).toString();
}

/**
 * Fresh (no-store) read of a content key for the admin editor.
 * - Missing token → redirect to login.
 * - 401 → redirect to login.
 * - 404 → null (row not yet materialized; editor prefills with defaults).
 * - Network error, non-ok status, or JSON parse failure → throws so the page
 *   fails via the error boundary instead of silently prefilling defaults.
 */
async function adminGetContent<T>(key: string): Promise<T | null> {
  const store = await cookies();
  const token = store.get(ADMIN_ACCESS_COOKIE)?.value;
  if (!token) {
    redirect("/admin/login");
  }
  let res: Response;
  try {
    res = await fetch(buildUrl(`content/${encodeURIComponent(key)}`), {
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store",
    });
  } catch (err) {
    // Network-level failure — throw so the error boundary catches it.
    throw err instanceof Error ? err : new Error(String(err));
  }
  if (res.status === 401) {
    // RSC render context can't mutate cookies; route handlers clear them via Set-Cookie.
    redirect("/admin/login");
  }
  if (res.status === 404) {
    return null;
  }
  if (!res.ok) {
    throw new ApiError(res.statusText, res.status, null);
  }
  try {
    const body = (await res.json()) as ContentResponse<T>;
    return body.content;
  } catch (err) {
    throw err instanceof Error ? err : new Error("Failed to parse content response");
  }
}

export const serverContentService = {
  about: () => adminGetContent<AboutContent>("about"),
  intro: () => adminGetContent<IntroContent>("intro"),
};
