import "server-only";

import { revalidateTag } from "next/cache";
import { cookies } from "next/headers";
import { API_BASE_URL, SITE_URL } from "@/constants";
import { POSTS_CACHE_TAG } from "@/services/postService";

export const ADMIN_ACCESS_COOKIE = "admin_access";
export const ADMIN_REFRESH_COOKIE = "admin_refresh";

// Legacy alias used by older code paths during migration. Will be removed once
// every reference points at ADMIN_ACCESS_COOKIE.
export const ADMIN_COOKIE_NAME = ADMIN_ACCESS_COOKIE;

const ACCESS_MAX_AGE = 60 * 15; // 15 minutes — matches JWT_ACCESS_EXPIRE_MINUTES
const REFRESH_MAX_AGE = 60 * 60 * 24 * 7; // 7 days — matches JWT_REFRESH_EXPIRE_MINUTES

function buildBeUrl(path: string, search?: URLSearchParams | string | null): string {
  const base = API_BASE_URL.endsWith("/") ? API_BASE_URL : `${API_BASE_URL}/`;
  const url = new URL(path.replace(/^\/+/, ""), base);
  if (search) {
    const usp = typeof search === "string" ? new URLSearchParams(search) : search;
    usp.forEach((v, k) => url.searchParams.set(k, v));
  }
  return url.toString();
}

type ForwardOptions = {
  method: "GET" | "POST" | "PATCH" | "DELETE" | "PUT";
  bePath: string;
  search?: URLSearchParams | null;
  body?: unknown;
  request: Request;
  /** Tags to revalidate on a successful non-GET mutation. Defaults to [POSTS_CACHE_TAG]. */
  revalidateTags?: string[];
};

// Origins the admin browser is allowed to call these route handlers from.
// `request.url` is NOT trustworthy here: under `next start`/standalone the server binds
// 0.0.0.0:3000 and Next derives request.url's origin from that bind address, ignoring the
// Host / X-Forwarded-Host the reverse proxy (Istio) sets. So behind TLS at https://notypie.dev
// the browser sends `Origin: https://notypie.dev` while request.url.origin is
// `http://0.0.0.0:3000`, and a naive equality check rejects every legit same-site request.
// Instead we pin the allowlist to the build-time SITE_URL (the real public origin) and still
// accept request.url's origin so local dev (SITE_URL == bind origin == localhost:3000) works.
function allowedOrigins(request: Request): Set<string> {
  const out = new Set<string>();
  try {
    out.add(new URL(SITE_URL).origin);
  } catch {
    /* SITE_URL malformed — fall through to request.url only */
  }
  try {
    out.add(new URL(request.url).origin);
  } catch {
    /* ignore */
  }
  return out;
}

function originIsAllowed(request: Request): boolean {
  const allowed = allowedOrigins(request);
  const origin = request.headers.get("origin");
  if (origin !== null) {
    if (origin === "null") return false;
    try {
      return allowed.has(new URL(origin).origin);
    } catch {
      return false;
    }
  }
  const referer = request.headers.get("referer");
  if (referer !== null) {
    try {
      return allowed.has(new URL(referer).origin);
    } catch {
      return false;
    }
  }
  return false;
}

export function assertSameOrigin(request: Request): Response | null {
  if (!originIsAllowed(request)) {
    return Response.json({ error: "forbidden_cross_origin" }, { status: 403 });
  }
  return null;
}

function cookieAttrs(maxAge: number): string {
  const secure = process.env.NODE_ENV === "production" ? "; Secure" : "";
  return `Max-Age=${maxAge}; Path=/; HttpOnly; SameSite=Strict${secure}`;
}

export function buildSetCookieHeader(name: string, value: string, maxAge: number): string {
  return `${name}=${value}; ${cookieAttrs(maxAge)}`;
}

export function buildClearCookieHeader(name: string = ADMIN_ACCESS_COOKIE): string {
  return `${name}=; Max-Age=0; Path=/; HttpOnly; SameSite=Strict${
    process.env.NODE_ENV === "production" ? "; Secure" : ""
  }`;
}

/** Build Set-Cookie pairs for a fresh access+refresh token pair (login or rotation). */
export function buildAuthCookies(accessToken: string, refreshToken: string): [string, string] {
  return [
    buildSetCookieHeader(ADMIN_ACCESS_COOKIE, accessToken, ACCESS_MAX_AGE),
    buildSetCookieHeader(ADMIN_REFRESH_COOKIE, refreshToken, REFRESH_MAX_AGE),
  ];
}

/** Build Set-Cookie pairs that clear both auth cookies. */
export function buildClearAuthCookies(): [string, string] {
  return [buildClearCookieHeader(ADMIN_ACCESS_COOKIE), buildClearCookieHeader(ADMIN_REFRESH_COOKIE)];
}

interface TokenPair {
  accessToken: string;
  refreshToken: string;
}

/** Internal: ask BE to rotate tokens given a refresh token. Returns null on failure. */
async function tryRefresh(refreshToken: string): Promise<TokenPair | null> {
  const url = buildBeUrl("auth/refresh");
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refreshToken }),
      cache: "no-store",
    });
    if (!res.ok) return null;
    const body = (await res.json()) as TokenPair;
    if (typeof body.accessToken !== "string" || typeof body.refreshToken !== "string") return null;
    return body;
  } catch {
    return null;
  }
}

async function callBe(url: string, method: string, accessToken: string, body: unknown): Promise<Response> {
  const init: RequestInit = {
    method,
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    cache: "no-store",
  };
  if (body !== undefined && method !== "GET" && method !== "DELETE") {
    init.body = JSON.stringify(body);
  }
  return fetch(url, init);
}

/**
 * Forwards the request to the BE with `Authorization: Bearer <access>`. If the
 * BE rejects with 401 and a refresh token is present, transparently rotates
 * tokens via /v1/auth/refresh, retries the original request, and attaches
 * the new cookies to the response. If refresh also fails, clears both
 * cookies so the next page load redirects to /admin/login.
 */
export async function forwardToBeAsAdmin({
  method,
  bePath,
  search,
  body,
  request,
  revalidateTags = [POSTS_CACHE_TAG],
}: ForwardOptions): Promise<Response> {
  if (!request || !originIsAllowed(request)) {
    return Response.json({ error: "forbidden_cross_origin" }, { status: 403 });
  }
  const store = await cookies();
  const access = store.get(ADMIN_ACCESS_COOKIE)?.value;
  const refresh = store.get(ADMIN_REFRESH_COOKIE)?.value;

  if (!access && !refresh) {
    return Response.json({ error: "unauthorized" }, { status: 401 });
  }

  const url = buildBeUrl(bePath, search ?? undefined);
  const newCookies: string[] = [];
  let currentAccess = access;

  // If only refresh is present (access cookie expired client-side), rotate up-front.
  if (!currentAccess && refresh) {
    const pair = await tryRefresh(refresh);
    if (!pair) {
      return new Response(
        JSON.stringify({ error: "unauthorized" }),
        {
          status: 401,
          headers: makeHeaders({ "Content-Type": "application/json" }, buildClearAuthCookies()),
        },
      );
    }
    currentAccess = pair.accessToken;
    newCookies.push(...buildAuthCookies(pair.accessToken, pair.refreshToken));
  }

  let beRes: Response;
  try {
    beRes = await callBe(url, method, currentAccess as string, body);
  } catch (err) {
    console.error("[adminProxy] BE unreachable (initial call)", err);
    return Response.json(
      { error: "upstream_unreachable" },
      { status: 502 },
    );
  }

  // 401 → try refresh-and-retry once if refresh cookie is present.
  if (beRes.status === 401 && refresh) {
    const pair = await tryRefresh(refresh);
    if (pair) {
      newCookies.push(...buildAuthCookies(pair.accessToken, pair.refreshToken));
      try {
        beRes = await callBe(url, method, pair.accessToken, body);
      } catch (err) {
        console.error("[adminProxy] BE unreachable (retry after refresh)", err);
        return Response.json(
          { error: "upstream_unreachable" },
          { status: 502 },
        );
      }
    } else {
      // Refresh failed — clear both cookies so the browser drops the stale session.
      return forwardWithCookies(beRes, buildClearAuthCookies());
    }
  } else if (beRes.status === 401) {
    // No refresh cookie at all — propagate 401 and clear whatever access cookie remains.
    return forwardWithCookies(beRes, [buildClearCookieHeader(ADMIN_ACCESS_COOKIE)]);
  }

  // A successful mutation expires the public post reads (list/detail/nav) so the next read
  // is a fresh, blocking revalidate rather than the 60s window or stale-while-revalidate.
  // `{ expire: 0 }` is the non-deprecated way to get immediate invalidation (vs "max",
  // which would serve stale content once while refreshing in the background) — a
  // single-author blog wants to see its own edit reflected right away.
  if (method !== "GET" && beRes.ok) {
    for (const tag of revalidateTags) {
      revalidateTag(tag, { expire: 0 });
    }
  }

  return forwardWithCookies(beRes, newCookies);
}

function makeHeaders(base: Record<string, string>, setCookies: string[]): Headers {
  const h = new Headers(base);
  for (const c of setCookies) h.append("Set-Cookie", c);
  return h;
}

async function forwardWithCookies(beRes: Response, setCookies: string[]): Promise<Response> {
  if (beRes.status === 204) {
    return new Response(null, { status: 204, headers: makeHeaders({}, setCookies) });
  }
  const ct = beRes.headers.get("content-type") ?? "";
  const text = await beRes.text();
  if (ct.includes("application/json")) {
    return new Response(text, {
      status: beRes.status,
      headers: makeHeaders({ "Content-Type": "application/json" }, setCookies),
    });
  }
  return new Response(text, { status: beRes.status, headers: makeHeaders({}, setCookies) });
}

export { buildBeUrl };
