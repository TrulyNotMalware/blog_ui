import { cookies } from "next/headers";
import {
  ADMIN_ACCESS_COOKIE,
  ADMIN_REFRESH_COOKIE,
  assertSameOrigin,
  buildBeUrl,
} from "@/server/adminProxy";

const ACCESS_MAX_AGE = 60 * 15; // 15 min
const REFRESH_MAX_AGE = 60 * 60 * 24 * 7; // 7 days

interface LoginBody {
  username?: unknown;
  password?: unknown;
}

interface BeTokenPair {
  accessToken?: string;
  refreshToken?: string;
}

// In-memory rate limit: 5 attempts per IP per 60 s.
const _loginAttempts = new Map<string, { count: number; resetAt: number }>();

/** Exposed only for unit tests — clears rate-limit state between test runs. */
export function _resetRateLimiterForTest(): void {
  if (process.env.NODE_ENV === "production") {
    throw new Error("_resetRateLimiterForTest must not be called in production");
  }
  _loginAttempts.clear();
}

function clientIp(request: Request): string {
  const xff = request.headers.get("x-forwarded-for");
  if (xff) {
    // Use the rightmost entry (added by the trusted proxy, not the client).
    const parts = xff.split(",").map((s) => s.trim()).filter(Boolean);
    return parts[parts.length - 1] ?? "unknown";
  }
  return request.headers.get("x-real-ip") ?? "unknown";
}

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  // Opportunistic eviction to bound memory on long-running instances.
  if (_loginAttempts.size > 10_000) {
    for (const [k, v] of _loginAttempts) if (v.resetAt < now) _loginAttempts.delete(k);
  }
  const entry = _loginAttempts.get(ip);
  if (!entry || entry.resetAt < now) {
    _loginAttempts.set(ip, { count: 1, resetAt: now + 60_000 });
    return false;
  }
  if (entry.count >= 5) return true;
  entry.count++;
  return false;
}

export async function POST(request: Request) {
  const csrfCheck = assertSameOrigin(request);
  if (csrfCheck) return csrfCheck;

  const ip = clientIp(request);
  if (isRateLimited(ip)) {
    return Response.json({ error: "too_many_requests" }, { status: 429 });
  }

  let payload: LoginBody;
  try {
    payload = (await request.json()) as LoginBody;
  } catch {
    return Response.json({ error: "invalid_json" }, { status: 400 });
  }
  const { username, password } = payload;
  if (typeof username !== "string" || typeof password !== "string" || !username || !password) {
    return Response.json({ error: "missing_credentials" }, { status: 400 });
  }

  // Kick off cookies() in parallel with the BE round-trip.
  const storePromise = cookies();

  let beRes: Response;
  try {
    beRes = await fetch(buildBeUrl("auth/login"), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password }),
      cache: "no-store",
    });
  } catch (err) {
    console.error("[admin/login] upstream fetch failed", err);
    return Response.json({ error: "upstream_unreachable" }, { status: 502 });
  }

  if (!beRes.ok) {
    if (beRes.status === 429) {
      return Response.json({ error: "too_many_requests" }, { status: 429 });
    }
    const status = beRes.status === 401 || beRes.status === 400 ? 401 : 502;
    return Response.json({ error: "login_failed" }, { status });
  }

  let data: BeTokenPair;
  try {
    data = (await beRes.json()) as BeTokenPair;
  } catch {
    return Response.json({ error: "invalid_upstream_response" }, { status: 502 });
  }
  if (!data.accessToken || !data.refreshToken) {
    return Response.json({ error: "no_token_in_response" }, { status: 502 });
  }

  const store = await storePromise;
  const baseAttrs = {
    path: "/",
    httpOnly: true,
    sameSite: "strict" as const,
    secure: process.env.NODE_ENV === "production",
  };
  store.set({ ...baseAttrs, name: ADMIN_ACCESS_COOKIE, value: data.accessToken, maxAge: ACCESS_MAX_AGE });
  store.set({ ...baseAttrs, name: ADMIN_REFRESH_COOKIE, value: data.refreshToken, maxAge: REFRESH_MAX_AGE });

  return Response.json({ ok: true });
}
