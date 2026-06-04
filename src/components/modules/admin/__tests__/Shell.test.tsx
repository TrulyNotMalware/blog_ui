// @vitest-environment jsdom
import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
import { AdminShell } from "../Shell";

vi.mock("next/link", () => ({
  default: ({
    href,
    children,
    ...props
  }: {
    href: string;
    children: React.ReactNode;
    [key: string]: unknown;
  }) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));

vi.mock("@/components/modules/admin/LogoutButton", () => ({
  LogoutButton: () => <button>logout</button>,
}));

vi.mock("@/components/layout/ThemeToggle", () => ({
  ThemeToggle: () => <button>theme</button>,
}));

afterEach(() => {
  cleanup();
});

describe("AdminShell nav tabs", () => {
  it("renders exactly 3 tabs: posts, drafts, tags", () => {
    render(<AdminShell />);
    const nav = screen.getByRole("navigation");
    const links = Array.from(nav.querySelectorAll("a")).filter((a) =>
      ["posts", "drafts", "tags"].some((label) => a.textContent?.includes(label)),
    );
    expect(links).toHaveLength(3);
    expect(links[0].textContent).toContain("posts");
    expect(links[1].textContent).toContain("drafts");
    expect(links[2].textContent).toContain("tags");
  });

  it("does not render media or settings tabs", () => {
    render(<AdminShell />);
    const nav = screen.getByRole("navigation");
    const allText = nav.textContent ?? "";
    // nav also contains branch/live status text — check for tab link text specifically
    const links = Array.from(nav.querySelectorAll("a")).map((a) => a.textContent ?? "");
    const hasMedia = links.some((t) => /^media/.test(t.trim()));
    const hasSettings = links.some((t) => /^settings/.test(t.trim()));
    expect(hasMedia).toBe(false);
    expect(hasSettings).toBe(false);
    void allText; // suppress unused warning
  });

  it("active tab gets bottom border indicator style", () => {
    render(<AdminShell tab="drafts" />);
    const nav = screen.getByRole("navigation");
    const links = Array.from(nav.querySelectorAll("a"));
    const draftsLink = links.find((a) => a.textContent?.includes("drafts"));
    expect(draftsLink).toBeDefined();
    // active tab has borderBottom with var(--ink), inactive has transparent
    expect(draftsLink!.style.borderBottom).toContain("var(--ink)");
  });

  it("inactive tabs have transparent bottom border", () => {
    render(<AdminShell tab="posts" />);
    const nav = screen.getByRole("navigation");
    const links = Array.from(nav.querySelectorAll("a"));
    const draftsLink = links.find((a) => a.textContent?.includes("drafts"));
    const tagsLink = links.find((a) => a.textContent?.includes("tags"));
    expect(draftsLink!.style.borderBottom).toContain("transparent");
    expect(tagsLink!.style.borderBottom).toContain("transparent");
  });
});
