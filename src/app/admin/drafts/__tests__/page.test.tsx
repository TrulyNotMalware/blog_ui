// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
import type { AdminPostRow } from "@/types";

const { mockAdminList, mockAdminPosts } = vi.hoisted(() => ({
  mockAdminList: vi.fn(),
  mockAdminPosts: vi.fn(),
}));

vi.mock("@/server/serverPostService", () => ({
  serverPostService: {
    adminList: mockAdminList,
  },
}));

vi.mock("@/components/modules/admin/Posts", () => ({
  AdminPosts: (props: { rows: AdminPostRow[]; total: number; activeFilter: string; shellTab?: string }) => {
    mockAdminPosts(props);
    return (
      <div data-testid="admin-posts" data-total={props.total} data-active-filter={props.activeFilter}>
        {props.rows.length} rows
      </div>
    );
  },
}));

vi.mock("@/components/modules/admin/AdminShortcuts", () => ({
  AdminShortcuts: () => <div data-testid="admin-shortcuts" />,
}));

vi.mock("@/components/layout/ResponsiveSwitch", () => ({
  ResponsiveSwitch: ({ desktop, mobile }: { desktop: React.ReactNode; mobile: React.ReactNode }) => (
    <div data-testid="responsive-switch">
      <div data-viewport="desktop">{desktop}</div>
      <div data-viewport="mobile">{mobile}</div>
    </div>
  ),
}));

vi.mock("@/components/modules/mobile/Mobile", () => ({
  MobileAdmin: ({ rows, activeFilter }: { rows: AdminPostRow[]; activeFilter: string }) => (
    <div data-testid="mobile-admin" data-active-filter={activeFilter}>
      {rows.length} rows
    </div>
  ),
}));

import React from "react";
import AdminDraftsPage from "../page";

const mockItem = {
  id: "test-draft",
  title: "Test Draft",
  status: "draft" as const,
  kind: "essay" as const,
  tags: ["tag1"],
  views: 0,
  updatedAt: "2024-01-01T00:00:00Z",
  excerpt: "",
  date: "2024-01-01",
  readTime: "1 min",
  createdAt: "2024-01-01T00:00:00Z",
  content: "",
};

beforeEach(() => {
  mockAdminList.mockResolvedValue({
    items: [mockItem],
    total: 1,
    page: 1,
    pageSize: 100,
    hasNext: false,
  });
});

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

describe("AdminDraftsPage", () => {
  it("renders without crashing given mock data", async () => {
    const jsx = await AdminDraftsPage();
    render(jsx);
    expect(screen.getByTestId("admin-posts")).toBeInTheDocument();
    expect(screen.getByTestId("mobile-admin")).toBeInTheDocument();
  });

  it("calls adminList with { pageSize: 100, status: 'draft' }", async () => {
    await AdminDraftsPage();
    expect(mockAdminList).toHaveBeenCalledWith({ pageSize: 100, status: "draft" });
  });

  it("passes activeFilter='draft' to AdminPosts", async () => {
    const jsx = await AdminDraftsPage();
    render(jsx);
    expect(screen.getByTestId("admin-posts")).toHaveAttribute("data-active-filter", "draft");
  });

  it("passes shellTab='drafts' and activeFilter='draft' to AdminPosts", async () => {
    const jsx = await AdminDraftsPage();
    render(jsx);
    expect(mockAdminPosts).toHaveBeenCalledWith(
      expect.objectContaining({ shellTab: "drafts", activeFilter: "draft" }),
    );
  });

  it("passes activeFilter='draft' to MobileAdmin", async () => {
    const jsx = await AdminDraftsPage();
    render(jsx);
    expect(screen.getByTestId("mobile-admin")).toHaveAttribute("data-active-filter", "draft");
  });
});
