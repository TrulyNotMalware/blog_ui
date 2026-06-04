import { beforeEach, describe, expect, it, vi } from "vitest";

const { mockCookieStore, mockCookies } = vi.hoisted(() => {
  const mockCookieStore = {
    get: vi.fn(),
    set: vi.fn(),
    delete: vi.fn(),
  };
  const mockCookies = vi.fn().mockResolvedValue(mockCookieStore);
  return { mockCookieStore, mockCookies };
});

vi.mock("next/headers", () => ({
  cookies: mockCookies,
}));

// revalidateTag requires a Next request/static-generation store that only exists inside a
// real Route Handler. Stub it so unit tests of forwardToBeAsAdmin can exercise the mutation
// path without that runtime context.
vi.mock("next/cache", () => ({
  revalidateTag: vi.fn(),
}));

vi.mock("server-only", () => ({}));

import { ADMIN_COOKIE_NAME, assertSameOrigin, buildBeUrl, buildClearCookieHeader, forwardToBeAsAdmin } from "../adminProxy";

beforeEach(() => {
  vi.resetAllMocks();
  mockCookies.mockResolvedValue(mockCookieStore);
  mockCookieStore.get.mockReturnValue(undefined);
  vi.stubGlobal("fetch", vi.fn());
});

function makeGetReq(bePath = "posts") {
  return new Request(`http://localhost:3001/api/${bePath}`, {
    headers: { origin: "http://localhost:3001" },
  });
}

// ─────────────────────────────────────────────
// buildBeUrl
// ─────────────────────────────────────────────
describe("buildBeUrl", () => {
  it("appends path to API_BASE_URL", () => {
    const url = buildBeUrl("posts");
    expect(url).toContain("posts");
  });

  it("forwards search params (URLSearchParams)", () => {
    const params = new URLSearchParams({ page: "2", size: "10" });
    const url = buildBeUrl("posts", params);
    expect(url).toContain("page=2");
    expect(url).toContain("size=10");
  });

  it("forwards search params (string)", () => {
    const url = buildBeUrl("posts", "tag=foo");
    expect(url).toContain("tag=foo");
  });
});

// ─────────────────────────────────────────────
// ADMIN_COOKIE_NAME
// ─────────────────────────────────────────────
describe("ADMIN_COOKIE_NAME", () => {
  it("is admin_access", () => {
    expect(ADMIN_COOKIE_NAME).toBe("admin_access");
  });
});

// ─────────────────────────────────────────────
// assertSameOrigin
// ─────────────────────────────────────────────
describe("assertSameOrigin", () => {
  it("same-origin Origin → null (allow)", () => {
    const req = new Request("https://example.com/api/foo", {
      headers: { origin: "https://example.com" },
    });
    expect(assertSameOrigin(req)).toBeNull();
  });

  it("mismatched Origin → 403 Response", async () => {
    const req = new Request("https://example.com/api/foo", {
      headers: { origin: "https://evil.com" },
    });
    const res = assertSameOrigin(req);
    expect(res).not.toBeNull();
    expect(res!.status).toBe(403);
    const body = await res!.json();
    expect(body.error).toBe("forbidden_cross_origin");
  });

  it("Origin: null (opaque) → 403", async () => {
    const req = new Request("https://example.com/api/foo", {
      headers: { origin: "null" },
    });
    const res = assertSameOrigin(req);
    expect(res!.status).toBe(403);
  });

  it("no Origin + same-origin Referer → null (allow)", () => {
    const req = new Request("https://example.com/api/foo", {
      headers: { referer: "https://example.com/page" },
    });
    expect(assertSameOrigin(req)).toBeNull();
  });

  it("no Origin + mismatched Referer → 403", async () => {
    const req = new Request("https://example.com/api/foo", {
      headers: { referer: "https://evil.com/page" },
    });
    const res = assertSameOrigin(req);
    expect(res!.status).toBe(403);
  });

  it("no Origin + no Referer → 403", async () => {
    const req = new Request("https://example.com/api/foo");
    const res = assertSameOrigin(req);
    expect(res!.status).toBe(403);
  });
});

describe("forwardToBeAsAdmin — no auth cookies", () => {
  it("returns 401 unauthorized when both cookies are missing", async () => {
    mockCookieStore.get.mockReturnValue(undefined);

    const res = await forwardToBeAsAdmin({ method: "GET", bePath: "posts", request: makeGetReq() });

    expect(res.status).toBe(401);
    const body = await res.json();
    expect(body.error).toBe("unauthorized");
  });
});

describe("forwardToBeAsAdmin — GET 성공", () => {
  beforeEach(() => {
    mockCookieStore.get.mockReturnValue({ value: "test-token" });
  });

  it("Authorization 헤더 포함해서 BE 요청", async () => {
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue(
      new Response(JSON.stringify({ data: [] }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }),
    );

    await forwardToBeAsAdmin({ method: "GET", bePath: "posts", request: makeGetReq() });

    const [url, init] = (global.fetch as ReturnType<typeof vi.fn>).mock.calls[0];
    expect(url).toContain("posts");
    expect((init as RequestInit).headers).toMatchObject({
      Authorization: "Bearer test-token",
    });
  });

  it("BE 응답 body를 그대로 반환", async () => {
    const payload = { items: [{ id: "1" }] };
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue(
      new Response(JSON.stringify(payload), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }),
    );

    const res = await forwardToBeAsAdmin({ method: "GET", bePath: "posts", request: makeGetReq() });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toEqual(payload);
  });

  it("search params를 BE URL에 전달", async () => {
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue(
      new Response("{}", { status: 200, headers: { "Content-Type": "application/json" } }),
    );

    const search = new URLSearchParams({ page: "3" });
    await forwardToBeAsAdmin({ method: "GET", bePath: "posts", search, request: makeGetReq() });

    const [url] = (global.fetch as ReturnType<typeof vi.fn>).mock.calls[0];
    expect(url).toContain("page=3");
  });

  it("GET 요청에는 body를 포함하지 않음", async () => {
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue(
      new Response("{}", { status: 200, headers: { "Content-Type": "application/json" } }),
    );

    await forwardToBeAsAdmin({ method: "GET", bePath: "posts", body: { x: 1 }, request: makeGetReq() });

    const [, init] = (global.fetch as ReturnType<typeof vi.fn>).mock.calls[0];
    expect((init as RequestInit).body).toBeUndefined();
  });
});

describe("forwardToBeAsAdmin — CSRF Origin 검사", () => {
  beforeEach(() => {
    mockCookieStore.get.mockReturnValue({ value: "tok" });
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue(
      new Response(JSON.stringify({ ok: true }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }),
    );
  });

  it("state-changing + mismatched Origin → 403 forbidden_cross_origin", async () => {
    const req = new Request("http://localhost:3001/api/admin/posts", {
      method: "POST",
      headers: { origin: "http://evil.example.com" },
    });

    const res = await forwardToBeAsAdmin({
      method: "POST",
      bePath: "posts",
      request: req,
    });

    expect(res.status).toBe(403);
    const body = await res.json();
    expect(body.error).toBe("forbidden_cross_origin");
  });

  it("state-changing + matching Origin → 정상 전달", async () => {
    const req = new Request("http://localhost:3001/api/admin/posts", {
      method: "POST",
      headers: { origin: "http://localhost:3001" },
    });

    const res = await forwardToBeAsAdmin({
      method: "POST",
      bePath: "posts",
      body: { title: "hi" },
      request: req,
    });

    expect(res.status).toBe(200);
  });

  it("state-changing + Origin 없음 + Referer 없음 → 403 forbidden_cross_origin", async () => {
    const req = new Request("http://localhost:3001/api/admin/posts/1", {
      method: "DELETE",
    });

    const res = await forwardToBeAsAdmin({
      method: "DELETE",
      bePath: "posts/1",
      request: req,
    });

    expect(res.status).toBe(403);
    const body = await res.json();
    expect(body.error).toBe("forbidden_cross_origin");
  });

  it("state-changing + Referer 있음 + 같은 origin → 정상 전달", async () => {
    const req = new Request("http://localhost:3001/api/admin/posts/1", {
      method: "DELETE",
      headers: { referer: "http://localhost:3001/admin/posts" },
    });

    const res = await forwardToBeAsAdmin({
      method: "DELETE",
      bePath: "posts/1",
      request: req,
    });

    expect(res.status).toBe(200);
  });

  it("state-changing + Referer 있음 + 다른 host → 403 forbidden_cross_origin", async () => {
    const req = new Request("http://localhost:3001/api/admin/posts/1", {
      method: "DELETE",
      headers: { referer: "http://evil.example.com/page" },
    });

    const res = await forwardToBeAsAdmin({
      method: "DELETE",
      bePath: "posts/1",
      request: req,
    });

    expect(res.status).toBe(403);
    const body = await res.json();
    expect(body.error).toBe("forbidden_cross_origin");
  });

  it("Origin: null (opaque) → 403 forbidden_cross_origin", async () => {
    const req = new Request("http://localhost:3001/api/admin/posts", {
      method: "POST",
      headers: { origin: "null" },
    });

    const res = await forwardToBeAsAdmin({
      method: "POST",
      bePath: "posts",
      request: req,
    });

    expect(res.status).toBe(403);
    const body = await res.json();
    expect(body.error).toBe("forbidden_cross_origin");
  });

  it("http Origin vs https request URL → 403 (scheme mismatch)", async () => {
    const req = new Request("https://x.example/api/admin/posts", {
      method: "POST",
      headers: { origin: "http://x.example" },
    });

    const res = await forwardToBeAsAdmin({
      method: "POST",
      bePath: "posts",
      request: req,
    });

    expect(res.status).toBe(403);
    const body = await res.json();
    expect(body.error).toBe("forbidden_cross_origin");
  });

  it("http Referer vs https request URL → 403 (scheme mismatch)", async () => {
    const req = new Request("https://x.example/api/admin/posts/1", {
      method: "DELETE",
      headers: { referer: "http://x.example/page" },
    });

    const res = await forwardToBeAsAdmin({
      method: "DELETE",
      bePath: "posts/1",
      request: req,
    });

    expect(res.status).toBe(403);
    const body = await res.json();
    expect(body.error).toBe("forbidden_cross_origin");
  });

  it("Origin with mismatched port → 403", async () => {
    const req = new Request("http://localhost:3001/api/admin/posts", {
      method: "POST",
      headers: { origin: "http://localhost:3000" },
    });

    const res = await forwardToBeAsAdmin({
      method: "POST",
      bePath: "posts",
      request: req,
    });

    expect(res.status).toBe(403);
    const body = await res.json();
    expect(body.error).toBe("forbidden_cross_origin");
  });

  it("state-changing call without request → 403 (fail-closed)", async () => {
    // TypeScript enforces request is required for state-changing methods.
    // Cast to bypass the type check to prove runtime behavior.
    const res = await forwardToBeAsAdmin(
      // @ts-expect-error — intentionally omitting required `request` to test runtime fail-closed
      { method: "POST", bePath: "posts" },
    );

    expect(res.status).toBe(403);
    const body = await res.json();
    expect(body.error).toBe("forbidden_cross_origin");
  });
});

describe("forwardToBeAsAdmin — BE 응답 처리", () => {
  beforeEach(() => {
    mockCookieStore.get.mockReturnValue({ value: "tok" });
  });

  it("BE 204 → body 없이 204 반환", async () => {
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue(
      new Response(null, { status: 204 }),
    );

    const req = new Request("http://localhost:3001/api/admin/posts/1", {
      method: "DELETE",
      headers: { origin: "http://localhost:3001" },
    });

    const res = await forwardToBeAsAdmin({ method: "DELETE", bePath: "posts/1", request: req });
    expect(res.status).toBe(204);
    expect(await res.text()).toBe("");
  });

  it("BE fetch 실패 → 502 upstream_unreachable", async () => {
    (global.fetch as ReturnType<typeof vi.fn>).mockRejectedValue(
      new Error("ECONNREFUSED"),
    );

    const res = await forwardToBeAsAdmin({ method: "GET", bePath: "posts", request: makeGetReq() });
    expect(res.status).toBe(502);
    const body = await res.json();
    expect(body.error).toBe("upstream_unreachable");
  });

  it("POST body를 JSON으로 전달", async () => {
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue(
      new Response(JSON.stringify({ id: "new" }), {
        status: 201,
        headers: { "Content-Type": "application/json" },
      }),
    );

    const req = new Request("http://localhost:3001/api/admin/posts", {
      method: "POST",
      headers: { origin: "http://localhost:3001" },
    });

    await forwardToBeAsAdmin({
      method: "POST",
      bePath: "posts",
      body: { title: "new post" },
      request: req,
    });

    const [, init] = (global.fetch as ReturnType<typeof vi.fn>).mock.calls[0];
    expect((init as RequestInit).body).toBe(JSON.stringify({ title: "new post" }));
  });

  it("PATCH body를 JSON으로 전달", async () => {
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue(
      new Response(JSON.stringify({ id: "1" }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }),
    );

    const req = new Request("http://localhost:3001/api/admin/posts/1", {
      method: "PATCH",
      headers: { origin: "http://localhost:3001" },
    });

    await forwardToBeAsAdmin({
      method: "PATCH",
      bePath: "posts/1",
      body: { title: "updated" },
      request: req,
    });

    const [, init] = (global.fetch as ReturnType<typeof vi.fn>).mock.calls[0];
    expect((init as RequestInit).body).toBe(JSON.stringify({ title: "updated" }));
  });

  it("DELETE 요청에는 body 포함하지 않음", async () => {
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue(
      new Response(null, { status: 204 }),
    );

    const req = new Request("http://localhost:3001/api/admin/posts/1", {
      method: "DELETE",
      headers: { origin: "http://localhost:3001" },
    });

    await forwardToBeAsAdmin({
      method: "DELETE",
      bePath: "posts/1",
      body: { shouldNotSend: true },
      request: req,
    });

    const [, init] = (global.fetch as ReturnType<typeof vi.fn>).mock.calls[0];
    expect((init as RequestInit).body).toBeUndefined();
  });
});

// ─────────────────────────────────────────────
// buildClearCookieHeader
// ─────────────────────────────────────────────
describe("buildClearCookieHeader", () => {
  it("contains admin_access=; Max-Age=0", () => {
    const header = buildClearCookieHeader();
    expect(header).toContain("admin_access=;");
    expect(header).toContain("Max-Age=0");
  });

  it("contains Path=/ and HttpOnly", () => {
    const header = buildClearCookieHeader();
    expect(header).toContain("Path=/");
    expect(header).toContain("HttpOnly");
  });
});

// ─────────────────────────────────────────────
// forwardToBeAsAdmin — BE 401 → clear-cookie header
// ─────────────────────────────────────────────
describe("forwardToBeAsAdmin — BE 401 → admin_access clear-cookie", () => {
  beforeEach(() => {
    mockCookieStore.get.mockReturnValue({ value: "expired-tok" });
  });

  it("BE 401 응답에 Set-Cookie admin_access clear 헤더 포함", async () => {
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue(
      new Response(JSON.stringify({ detail: "token expired" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      }),
    );

    const res = await forwardToBeAsAdmin({ method: "GET", bePath: "admin/posts", request: makeGetReq("admin/posts") });
    expect(res.status).toBe(401);
    const setCookie = res.headers.get("set-cookie");
    expect(setCookie).not.toBeNull();
    expect(setCookie).toContain("admin_access=;");
    expect(setCookie).toContain("Max-Age=0");
  });

  it("BE 200 응답에는 Set-Cookie 헤더 없음", async () => {
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue(
      new Response(JSON.stringify({ items: [] }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }),
    );

    const res = await forwardToBeAsAdmin({ method: "GET", bePath: "admin/posts", request: makeGetReq("admin/posts") });
    expect(res.status).toBe(200);
    expect(res.headers.get("set-cookie")).toBeNull();
  });
});

// ─────────────────────────────────────────────
// forwardToBeAsAdmin — refresh rotation on BE 401
// ─────────────────────────────────────────────
describe("forwardToBeAsAdmin — refresh rotation", () => {
  beforeEach(() => {
    mockCookieStore.get.mockImplementation((name: string) => {
      if (name === "admin_access") return { value: "expired-access" };
      if (name === "admin_refresh") return { value: "valid-refresh" };
      return undefined;
    });
  });

  it("BE 401 + refresh 성공 → /auth/refresh 호출 + 원 요청 재시도 + 두 새 cookie 응답에 첨부", async () => {
    const calls: Array<{ url: string; init?: RequestInit }> = [];
    (global.fetch as ReturnType<typeof vi.fn>).mockImplementation((url: string, init?: RequestInit) => {
      calls.push({ url, init });
      if (url.endsWith("/auth/refresh")) {
        return Promise.resolve(
          new Response(
            JSON.stringify({ accessToken: "new-access", refreshToken: "new-refresh" }),
            { status: 200, headers: { "Content-Type": "application/json" } },
          ),
        );
      }
      // First call (with expired access) returns 401; retry (with new access) returns 200.
      const auth = (init?.headers as Record<string, string> | undefined)?.Authorization;
      if (auth === "Bearer expired-access") {
        return Promise.resolve(
          new Response(JSON.stringify({ detail: "expired" }), {
            status: 401,
            headers: { "Content-Type": "application/json" },
          }),
        );
      }
      return Promise.resolve(
        new Response(JSON.stringify({ items: ["after-retry"] }), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        }),
      );
    });

    const res = await forwardToBeAsAdmin({ method: "GET", bePath: "admin/posts", request: makeGetReq("admin/posts") });
    expect(res.status).toBe(200);
    expect((await res.json()).items).toEqual(["after-retry"]);

    // /auth/refresh was invoked.
    expect(calls.some((c) => c.url.endsWith("/auth/refresh"))).toBe(true);
    // Original request retried with the new access token.
    expect(
      calls.some((c) => (c.init?.headers as Record<string, string> | undefined)?.Authorization === "Bearer new-access"),
    ).toBe(true);

    // Both fresh cookies attached.
    const setCookie = res.headers.get("set-cookie") ?? "";
    expect(setCookie).toContain("admin_access=new-access");
    expect(setCookie).toContain("admin_refresh=new-refresh");
  });

  it("BE 401 + refresh 실패 → 두 cookie clear 응답", async () => {
    (global.fetch as ReturnType<typeof vi.fn>).mockImplementation((url: string) => {
      if (url.endsWith("/auth/refresh")) {
        return Promise.resolve(
          new Response(JSON.stringify({ detail: "refresh expired" }), {
            status: 401,
            headers: { "Content-Type": "application/json" },
          }),
        );
      }
      return Promise.resolve(
        new Response(JSON.stringify({ detail: "expired" }), {
          status: 401,
          headers: { "Content-Type": "application/json" },
        }),
      );
    });

    const res = await forwardToBeAsAdmin({ method: "GET", bePath: "admin/posts", request: makeGetReq("admin/posts") });
    expect(res.status).toBe(401);
    const setCookie = res.headers.get("set-cookie") ?? "";
    expect(setCookie).toContain("admin_access=;");
    expect(setCookie).toContain("admin_refresh=;");
  });
});
