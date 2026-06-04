import { describe, expect, it } from "vitest";
import { NextRequest } from "next/server";
import { proxy } from "../proxy";

function makeRequest(pathname: string, cookieValue?: string): NextRequest {
  const url = new URL(`http://localhost:3001${pathname}`);
  const headers: Record<string, string> = {};
  if (cookieValue) {
    headers["cookie"] = `admin_access=${cookieValue}`;
  }
  return new NextRequest(url, { headers });
}

describe("proxy 미들웨어", () => {
  it("/admin/login → 쿠키 없어도 통과 (unconditional)", () => {
    const res = proxy(makeRequest("/admin/login"));
    // NextResponse.next() has no Location header
    expect(res.headers.get("location")).toBeNull();
  });

  it("/admin/login/subpath → 통과", () => {
    const res = proxy(makeRequest("/admin/login/reset"));
    expect(res.headers.get("location")).toBeNull();
  });

  it("/admin (쿠키 없음) → /admin/login으로 리다이렉트", () => {
    const res = proxy(makeRequest("/admin"));
    expect(res.status).toBeGreaterThanOrEqual(300);
    expect(res.status).toBeLessThan(400);
    expect(res.headers.get("location")).toContain("/admin/login");
  });

  it("/admin/dashboard (쿠키 없음) → /admin/login으로 리다이렉트", () => {
    const res = proxy(makeRequest("/admin/dashboard"));
    expect(res.headers.get("location")).toContain("/admin/login");
  });

  it("/admin (쿠키 있음) → 통과", () => {
    const res = proxy(makeRequest("/admin", "valid-token"));
    expect(res.headers.get("location")).toBeNull();
  });

  it("/admin/posts (쿠키 있음) → 통과", () => {
    const res = proxy(makeRequest("/admin/posts", "valid-token"));
    expect(res.headers.get("location")).toBeNull();
  });

  it("/posts (non-admin path) → 쿠키 없어도 통과", () => {
    const res = proxy(makeRequest("/posts"));
    expect(res.headers.get("location")).toBeNull();
  });

  it("/ (루트) → 통과", () => {
    const res = proxy(makeRequest("/"));
    expect(res.headers.get("location")).toBeNull();
  });
});
