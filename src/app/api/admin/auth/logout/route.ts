import { cookies } from "next/headers";
import {
  ADMIN_ACCESS_COOKIE,
  ADMIN_REFRESH_COOKIE,
  assertSameOrigin,
  buildBeUrl,
} from "@/server/adminProxy";

export async function POST(request: Request) {
  const csrfCheck = assertSameOrigin(request);
  if (csrfCheck) return csrfCheck;

  const store = await cookies();
  const access = store.get(ADMIN_ACCESS_COOKIE)?.value;

  // Best-effort: bump the BE-side token_version so the refresh token is also
  // invalidated. If the access cookie is already expired we simply skip — the
  // browser-side clear below still kills the session for this client.
  if (access) {
    try {
      await fetch(buildBeUrl("auth/logout"), {
        method: "POST",
        headers: { Authorization: `Bearer ${access}` },
        cache: "no-store",
      });
    } catch {
      /* swallow — local cookie clear is the source of truth client-side */
    }
  }

  store.delete(ADMIN_ACCESS_COOKIE);
  store.delete(ADMIN_REFRESH_COOKIE);
  return new Response(null, { status: 204 });
}
