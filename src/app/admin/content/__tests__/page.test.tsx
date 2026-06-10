// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";

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
  usePathname: () => "/admin/content",
  useSearchParams: () => new URLSearchParams(),
}));

vi.mock("server-only", () => ({}));

vi.mock("@/components/modules/admin/Shell", () => ({
  AdminShell: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  StatusBadge: () => null,
}));

vi.mock("@/components/modules/admin/ContentEditor", () => ({
  IntroEditor: ({ initial }: { initial: { lines: string[] } }) => (
    <div data-testid="intro-editor">{initial.lines.join(",")}</div>
  ),
  AboutEditor: ({ initial }: { initial: { headline: string } }) => (
    <div data-testid="about-editor">{initial.headline}</div>
  ),
}));

vi.mock("@/components/layout/ThemeToggle", () => ({
  ThemeToggle: () => <button>theme</button>,
}));

vi.mock("@/components/modules/admin/LogoutButton", () => ({
  LogoutButton: () => <button>logout</button>,
}));

import AdminContentPage from "../page";
import { DEFAULT_ABOUT, DEFAULT_INTRO } from "@/services/contentService";
import { ApiError } from "@/api/client";

function mockFetch(responses: Array<{ status: number; body: unknown }>) {
  let callIndex = 0;
  vi.spyOn(global, "fetch").mockImplementation(() => {
    const { status, body } = responses[callIndex] ?? responses[responses.length - 1];
    callIndex++;
    return Promise.resolve({
      ok: status >= 200 && status < 300,
      status,
      statusText: status === 404 ? "Not Found" : "OK",
      headers: new Headers({ "content-type": "application/json" }),
      json: () => Promise.resolve(body),
      text: () => Promise.resolve(JSON.stringify(body)),
    } as unknown as Response);
  });
}

beforeEach(() => {
  vi.clearAllMocks();
  mockCookies.mockResolvedValue(mockCookieStore);
  mockCookieStore.get.mockReturnValue({ value: "test-token" });
  mockRedirect.mockImplementation((url: string): never => {
    throw new Error(`NEXT_REDIRECT:${url}`);
  });
});

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

describe("AdminContentPage", () => {
  it("redirects to /admin/login when no cookie", async () => {
    mockCookieStore.get.mockReturnValue(undefined);
    await expect(AdminContentPage()).rejects.toThrow("NEXT_REDIRECT:/admin/login");
    expect(mockRedirect).toHaveBeenCalledWith("/admin/login");
  });

  it("renders IntroEditor and AboutEditor when authenticated", async () => {
    mockFetch([
      { status: 200, body: { key: "about", content: DEFAULT_ABOUT, updatedAt: "" } },
      { status: 200, body: { key: "intro", content: DEFAULT_INTRO, updatedAt: "" } },
    ]);

    const ui = await AdminContentPage();
    render(ui);

    expect(screen.getByTestId("intro-editor")).toBeInTheDocument();
    expect(screen.getByTestId("about-editor")).toBeInTheDocument();
  });

  it("falls back to DEFAULT_ABOUT and DEFAULT_INTRO on 404", async () => {
    mockFetch([
      { status: 404, body: {} },
      { status: 404, body: {} },
    ]);

    const ui = await AdminContentPage();
    render(ui);

    expect(screen.getByTestId("about-editor").textContent).toBe(DEFAULT_ABOUT.headline);
    expect(screen.getByTestId("intro-editor").textContent).toBe(DEFAULT_INTRO.lines.join(","));
  });

  it("500 from BE → page throws (error boundary, not default prefill)", async () => {
    mockFetch([
      { status: 500, body: { detail: "server error" } },
      { status: 500, body: { detail: "server error" } },
    ]);

    await expect(AdminContentPage()).rejects.toBeInstanceOf(ApiError);
  });
});
