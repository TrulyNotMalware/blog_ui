// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
import { API_BASE_URL } from "@/constants";

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
  useRouter: () => ({ push: vi.fn(), refresh: vi.fn(), replace: vi.fn() }),
  usePathname: () => "/admin/tags",
  useSearchParams: () => new URLSearchParams(),
}));

vi.mock("server-only", () => ({}));

import AdminTagsPage from "../page";

function mockFetch(status: number, body: unknown = []) {
  vi.spyOn(global, "fetch").mockResolvedValue({
    ok: status >= 200 && status < 300,
    status,
    statusText: status === 200 ? "OK" : "Error",
    headers: new Headers({ "content-type": "application/json" }),
    json: () => Promise.resolve(body),
    text: () => Promise.resolve(JSON.stringify(body)),
  } as unknown as Response);
}

beforeEach(() => {
  vi.clearAllMocks();
  mockCookies.mockResolvedValue(mockCookieStore);
  // Default: authenticated
  mockCookieStore.get.mockReturnValue({ value: "test-token" });
  mockRedirect.mockImplementation((url: string): never => {
    throw new Error(`NEXT_REDIRECT:${url}`);
  });
});

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

describe("AdminTagsPage", () => {
  it("redirects to /admin/login when no cookie", async () => {
    mockCookieStore.get.mockReturnValue(undefined);

    await expect(AdminTagsPage()).rejects.toThrow("NEXT_REDIRECT:/admin/login");
    expect(mockRedirect).toHaveBeenCalledWith("/admin/login");
  });

  it("renders tag list from mock data", async () => {
    mockFetch(200, [
      { name: "typescript", count: 5 },
      { name: "react", count: 3 },
    ]);

    const ui = await AdminTagsPage();
    render(ui);

    expect(screen.getByText("#typescript")).toBeInTheDocument();
    expect(screen.getByText("#react")).toBeInTheDocument();
  });

  it("shows tag name and count", async () => {
    mockFetch(200, [{ name: "nextjs", count: 7 }]);

    const ui = await AdminTagsPage();
    render(ui);

    expect(screen.getByText("#nextjs")).toBeInTheDocument();
    expect(screen.getByText("7")).toBeInTheDocument();
  });

  it("fetch is called with the correct URL", async () => {
    mockFetch(200, []);

    await AdminTagsPage();

    expect(fetch).toHaveBeenCalledOnce();
    const [url] = (fetch as ReturnType<typeof vi.fn>).mock.calls[0];
    const base = API_BASE_URL.endsWith("/") ? API_BASE_URL : `${API_BASE_URL}/`;
    expect(url).toBe(`${base}tags`);
  });

  it("shows empty state when no tags", async () => {
    mockFetch(200, []);

    const ui = await AdminTagsPage();
    render(ui);

    expect(screen.getByText("// no tags")).toBeInTheDocument();
  });
});
