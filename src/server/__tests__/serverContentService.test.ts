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

const mockRedirect = vi.hoisted(() =>
  vi.fn((url: string): never => {
    throw new Error(`NEXT_REDIRECT:${url}`);
  }),
);

vi.mock("next/headers", () => ({
  cookies: mockCookies,
}));

vi.mock("next/navigation", () => ({
  redirect: mockRedirect,
}));

vi.mock("server-only", () => ({}));

vi.mock("@/constants", () => ({
  API_BASE_URL: "http://be.test/v1",
  SITE_URL: "https://blog.example.com",
}));

import { serverContentService } from "../serverContentService";
import { ApiError } from "@/api/client";

beforeEach(() => {
  vi.resetAllMocks();
  mockCookies.mockResolvedValue(mockCookieStore);
  mockCookieStore.get.mockReturnValue({ value: "test-token" });
  mockRedirect.mockImplementation((url: string): never => {
    throw new Error(`NEXT_REDIRECT:${url}`);
  });
  vi.stubGlobal("fetch", vi.fn());
});

function makeFetchResponse(status: number, body: unknown): Response {
  return {
    ok: status >= 200 && status < 300,
    status,
    statusText: status === 404 ? "Not Found" : status === 500 ? "Internal Server Error" : "OK",
    headers: new Headers({ "content-type": "application/json" }),
    json: () => Promise.resolve(body),
    text: () => Promise.resolve(JSON.stringify(body)),
  } as unknown as Response;
}

// ─────────────────────────────────────────────
// serverContentService.about
// ─────────────────────────────────────────────
describe("serverContentService.about", () => {
  it("no token → redirects to /admin/login", async () => {
    mockCookieStore.get.mockReturnValue(undefined);
    await expect(serverContentService.about()).rejects.toThrow("NEXT_REDIRECT:/admin/login");
    expect(mockRedirect).toHaveBeenCalledWith("/admin/login");
  });

  it("401 → redirects to /admin/login", async () => {
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue(
      makeFetchResponse(401, { detail: "unauthorized" }),
    );
    await expect(serverContentService.about()).rejects.toThrow("NEXT_REDIRECT:/admin/login");
    expect(mockRedirect).toHaveBeenCalledWith("/admin/login");
  });

  it("404 → returns null", async () => {
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue(
      makeFetchResponse(404, { detail: "not found" }),
    );
    const result = await serverContentService.about();
    expect(result).toBeNull();
  });

  it("500 → throws ApiError", async () => {
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue(
      makeFetchResponse(500, { detail: "server error" }),
    );
    await expect(serverContentService.about()).rejects.toThrow();
    await expect(serverContentService.about()).rejects.toBeInstanceOf(ApiError);
  });

  it("network error → throws", async () => {
    (global.fetch as ReturnType<typeof vi.fn>).mockRejectedValue(new Error("ECONNREFUSED"));
    await expect(serverContentService.about()).rejects.toThrow("ECONNREFUSED");
  });

  it("200 → returns content", async () => {
    const content = { headline: "H", paragraphs: ["p"], now: [], stack: [], contact: [] };
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue(
      makeFetchResponse(200, { key: "about", content, updatedAt: "" }),
    );
    const result = await serverContentService.about();
    expect(result).toEqual(content);
  });
});

// ─────────────────────────────────────────────
// serverContentService.intro
// ─────────────────────────────────────────────
describe("serverContentService.intro", () => {
  it("no token → redirects to /admin/login", async () => {
    mockCookieStore.get.mockReturnValue(undefined);
    await expect(serverContentService.intro()).rejects.toThrow("NEXT_REDIRECT:/admin/login");
  });

  it("401 → redirects to /admin/login", async () => {
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue(
      makeFetchResponse(401, { detail: "unauthorized" }),
    );
    await expect(serverContentService.intro()).rejects.toThrow("NEXT_REDIRECT:/admin/login");
  });

  it("404 → returns null", async () => {
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue(
      makeFetchResponse(404, { detail: "not found" }),
    );
    const result = await serverContentService.intro();
    expect(result).toBeNull();
  });

  it("500 → throws ApiError", async () => {
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue(
      makeFetchResponse(500, { detail: "server error" }),
    );
    await expect(serverContentService.intro()).rejects.toBeInstanceOf(ApiError);
  });

  it("network error → throws", async () => {
    (global.fetch as ReturnType<typeof vi.fn>).mockRejectedValue(new TypeError("fetch failed"));
    await expect(serverContentService.intro()).rejects.toThrow("fetch failed");
  });

  it("200 → returns content", async () => {
    const content = { lines: ["Line A", "Line B"] };
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue(
      makeFetchResponse(200, { key: "intro", content, updatedAt: "" }),
    );
    const result = await serverContentService.intro();
    expect(result).toEqual(content);
  });
});
