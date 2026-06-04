import { NextResponse, type NextRequest } from "next/server";

const ACCESS_COOKIE = "admin_access";
const REFRESH_COOKIE = "admin_refresh";
const LOGIN_PATH = "/admin/login";

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (pathname === LOGIN_PATH || pathname.startsWith(`${LOGIN_PATH}/`)) {
    return NextResponse.next();
  }

  if (!pathname.startsWith("/admin")) {
    return NextResponse.next();
  }

  // Either cookie is enough to let the page through — if only refresh is
  // present, RSC/route-handler layers will rotate to a fresh access token on
  // the first BE call. Final auth verdict belongs to the BE.
  const hasAccess = !!request.cookies.get(ACCESS_COOKIE)?.value;
  const hasRefresh = !!request.cookies.get(REFRESH_COOKIE)?.value;
  if (hasAccess || hasRefresh) {
    return NextResponse.next();
  }

  const loginUrl = new URL(LOGIN_PATH, request.url);
  return NextResponse.redirect(loginUrl);
}

export const config = {
  matcher: ["/admin/:path*"],
};
