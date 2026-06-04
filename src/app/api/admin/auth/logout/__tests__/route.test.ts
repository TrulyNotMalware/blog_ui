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

vi.mock("server-only", () => ({}));

import { POST } from "../route";

beforeEach(() => {
  vi.resetAllMocks();
  mockCookies.mockResolvedValue(mockCookieStore);
  mockCookieStore.get.mockReturnValue(undefined);
  vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(null, { status: 200 })));
});

function makeLogoutRequest(extraHeaders?: Record<string, string>): Request {
  return new Request("http://localhost:3001/api/admin/auth/logout", {
    method: "POST",
    headers: {
      origin: "http://localhost:3001",
      ...extraHeaders,
    },
  });
}

describe("POST /api/admin/auth/logout", () => {
  it("access cookie 있음 → BE /auth/logout 호출 + 두 쿠키 삭제 → 204", async () => {
    mockCookieStore.get.mockImplementation((name: string) =>
      name === "admin_access" ? { value: "acc-tok" } : undefined,
    );

    const res = await POST(makeLogoutRequest());
    expect(res.status).toBe(204);

    expect(global.fetch as ReturnType<typeof vi.fn>).toHaveBeenCalledTimes(1);
    const [url, init] = (global.fetch as ReturnType<typeof vi.fn>).mock.calls[0];
    expect(String(url)).toContain("/auth/logout");
    expect((init as RequestInit).headers).toMatchObject({ Authorization: "Bearer acc-tok" });

    const deleted = mockCookieStore.delete.mock.calls.map((c) => c[0]);
    expect(deleted).toContain("admin_access");
    expect(deleted).toContain("admin_refresh");
  });

  it("access cookie 없음 (만료) → BE 호출 skip, 그래도 두 쿠키 삭제", async () => {
    // mockCookieStore.get returns undefined by default → no access cookie
    const res = await POST(makeLogoutRequest());
    expect(res.status).toBe(204);
    expect(global.fetch as ReturnType<typeof vi.fn>).not.toHaveBeenCalled();
    const deleted = mockCookieStore.delete.mock.calls.map((c) => c[0]);
    expect(deleted).toContain("admin_access");
    expect(deleted).toContain("admin_refresh");
  });

  it("BE 호출 실패해도 cookie 삭제 진행", async () => {
    mockCookieStore.get.mockImplementation((name: string) =>
      name === "admin_access" ? { value: "acc-tok" } : undefined,
    );
    (global.fetch as ReturnType<typeof vi.fn>).mockRejectedValue(new Error("ECONNREFUSED"));

    const res = await POST(makeLogoutRequest());
    expect(res.status).toBe(204);
    const deleted = mockCookieStore.delete.mock.calls.map((c) => c[0]);
    expect(deleted).toContain("admin_access");
    expect(deleted).toContain("admin_refresh");
  });

  it("응답 body 가 비어있음", async () => {
    const res = await POST(makeLogoutRequest());
    expect(await res.text()).toBe("");
  });
});

describe("POST /api/admin/auth/logout — CSRF gating", () => {
  it("mismatched Origin → 403, cookie NOT deleted, BE NOT called", async () => {
    const req = new Request("http://localhost:3001/api/admin/auth/logout", {
      method: "POST",
      headers: { origin: "http://evil.example.com" },
    });
    const res = await POST(req);
    expect(res.status).toBe(403);
    expect((await res.json()).error).toBe("forbidden_cross_origin");
    expect(mockCookieStore.delete).not.toHaveBeenCalled();
    expect(global.fetch as ReturnType<typeof vi.fn>).not.toHaveBeenCalled();
  });

  it("no Origin + no Referer → 403, cookie NOT deleted", async () => {
    const req = new Request("http://localhost:3001/api/admin/auth/logout", {
      method: "POST",
    });
    const res = await POST(req);
    expect(res.status).toBe(403);
    expect(mockCookieStore.delete).not.toHaveBeenCalled();
  });

  it("no Origin + same-origin Referer → continues, two cookies deleted", async () => {
    const req = new Request("http://localhost:3001/api/admin/auth/logout", {
      method: "POST",
      headers: { referer: "http://localhost:3001/admin" },
    });
    const res = await POST(req);
    expect(res.status).toBe(204);
    const deleted = mockCookieStore.delete.mock.calls.map((c) => c[0]);
    expect(deleted).toContain("admin_access");
    expect(deleted).toContain("admin_refresh");
  });
});
