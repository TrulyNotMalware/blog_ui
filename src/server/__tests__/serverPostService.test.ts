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

const mockRedirect = vi.hoisted(() => vi.fn((url: string): never => {
  throw new Error(`NEXT_REDIRECT:${url}`);
}));

vi.mock("next/headers", () => ({
  cookies: mockCookies,
}));

vi.mock("next/navigation", () => ({
  redirect: mockRedirect,
}));

vi.mock("server-only", () => ({}));

import { ApiError } from "@/api/client";
import { serverPostService } from "../serverPostService";

beforeEach(() => {
  vi.resetAllMocks();
  mockCookies.mockResolvedValue(mockCookieStore);
  mockCookieStore.get.mockReturnValue(undefined);
  mockRedirect.mockImplementation((url: string): never => {
    throw new Error(`NEXT_REDIRECT:${url}`);
  });
  vi.stubGlobal("fetch", vi.fn());
});

function makeJsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

describe("serverPostService.adminList", () => {
  it("쿠키 없음 → redirect('/admin/login') 호출", async () => {
    mockCookieStore.get.mockReturnValue(undefined);

    await expect(serverPostService.adminList()).rejects.toThrow("NEXT_REDIRECT:/admin/login");
    expect(mockRedirect).toHaveBeenCalledWith("/admin/login");
  });

  it("BE 401 → redirect('/admin/login') (cookie 삭제는 호출 안 함 — Server Component 컨텍스트 제약)", async () => {
    mockCookieStore.get.mockReturnValue({ value: "expired-tok" });
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue(
      makeJsonResponse({ detail: "token expired" }, 401),
    );

    await expect(serverPostService.adminList()).rejects.toThrow("NEXT_REDIRECT:/admin/login");
    expect(mockCookieStore.delete).not.toHaveBeenCalled();
    expect(mockRedirect).toHaveBeenCalledWith("/admin/login");
  });

  it("쿠키 있음 → Authorization 헤더 포함해서 BE 호출", async () => {
    mockCookieStore.get.mockReturnValue({ value: "jwt-tok" });
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue(
      makeJsonResponse({ items: [], total: 0 }),
    );

    await serverPostService.adminList();

    const [, init] = (global.fetch as ReturnType<typeof vi.fn>).mock.calls[0];
    expect((init as RequestInit).headers).toMatchObject({
      Authorization: "Bearer jwt-tok",
    });
  });

  it("BE 200 → body 반환", async () => {
    mockCookieStore.get.mockReturnValue({ value: "tok" });
    const payload = { items: [{ id: "p1" }], total: 1 };
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue(
      makeJsonResponse(payload),
    );

    const result = await serverPostService.adminList();
    expect(result).toEqual(payload);
  });

  it("BE 404 → ApiError with status 404 throw", async () => {
    mockCookieStore.get.mockReturnValue({ value: "tok" });
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue(
      makeJsonResponse({ detail: "not found" }, 404),
    );

    const err = await serverPostService.adminList().catch((e) => e);
    expect(err).toBeInstanceOf(ApiError);
    expect(err.status).toBe(404);
  });

  it("search params가 URL에 포함됨", async () => {
    mockCookieStore.get.mockReturnValue({ value: "tok" });
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue(
      makeJsonResponse({ items: [], total: 0 }),
    );

    await serverPostService.adminList({ page: 2, pageSize: 5, tag: "react" });

    const [url] = (global.fetch as ReturnType<typeof vi.fn>).mock.calls[0];
    expect(url).toContain("page=2");
    expect(url).toContain("pageSize=5");
    expect(url).toContain("tag=react");
  });

  it("undefined params는 URL에 포함되지 않음", async () => {
    mockCookieStore.get.mockReturnValue({ value: "tok" });
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue(
      makeJsonResponse({ items: [], total: 0 }),
    );

    await serverPostService.adminList({ page: undefined, tag: undefined });

    const [url] = (global.fetch as ReturnType<typeof vi.fn>).mock.calls[0];
    expect(url).not.toContain("page");
    expect(url).not.toContain("tag");
  });
});

describe("serverPostService.adminDetail", () => {
  it("쿠키 없음 → redirect('/admin/login') 호출", async () => {
    mockCookieStore.get.mockReturnValue(undefined);

    await expect(serverPostService.adminDetail("p1")).rejects.toThrow("NEXT_REDIRECT:/admin/login");
    expect(mockRedirect).toHaveBeenCalledWith("/admin/login");
  });

  it("BE 401 → redirect('/admin/login') (cookie 삭제 안 함)", async () => {
    mockCookieStore.get.mockReturnValue({ value: "expired-tok" });
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue(
      makeJsonResponse({ detail: "token expired" }, 401),
    );

    await expect(serverPostService.adminDetail("p1")).rejects.toThrow("NEXT_REDIRECT:/admin/login");
    expect(mockCookieStore.delete).not.toHaveBeenCalled();
    expect(mockRedirect).toHaveBeenCalledWith("/admin/login");
  });

  it("쿠키 있음 → 올바른 URL로 BE 호출", async () => {
    mockCookieStore.get.mockReturnValue({ value: "tok" });
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue(
      makeJsonResponse({ id: "p1", title: "Test" }),
    );

    await serverPostService.adminDetail("p1");

    const [url] = (global.fetch as ReturnType<typeof vi.fn>).mock.calls[0];
    expect(url).toContain("admin/posts/p1");
  });

  it("id를 URL 인코딩해서 전달", async () => {
    mockCookieStore.get.mockReturnValue({ value: "tok" });
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue(
      makeJsonResponse({ id: "hello world" }),
    );

    await serverPostService.adminDetail("hello world");

    const [url] = (global.fetch as ReturnType<typeof vi.fn>).mock.calls[0];
    expect(url).toContain("hello%20world");
  });

  it("BE 200 → body 반환", async () => {
    mockCookieStore.get.mockReturnValue({ value: "tok" });
    const payload = { id: "p1", title: "Post 1" };
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue(
      makeJsonResponse(payload),
    );

    const result = await serverPostService.adminDetail("p1");
    expect(result).toEqual(payload);
  });

  it("BE 404 → ApiError status 404", async () => {
    mockCookieStore.get.mockReturnValue({ value: "tok" });
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue(
      makeJsonResponse({ detail: "not found" }, 404),
    );

    const err = await serverPostService.adminDetail("missing").catch((e) => e);
    expect(err).toBeInstanceOf(ApiError);
    expect(err.status).toBe(404);
  });
});
