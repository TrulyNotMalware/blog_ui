// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
import React from "react";
import { ApiError } from "@/api/client";
import type { PostAdmin } from "@/types";

const { mockAdminDetail, mockNotFound } = vi.hoisted(() => ({
  mockAdminDetail: vi.fn(),
  mockNotFound: vi.fn(() => { throw new Error("NEXT_NOT_FOUND"); }),
}));

vi.mock("@/server/serverPostService", () => ({
  serverPostService: { adminDetail: mockAdminDetail },
}));

vi.mock("next/navigation", () => ({
  notFound: mockNotFound,
}));

vi.mock("@/components/modules/admin/EditorForm", () => ({
  EditorForm: ({ mode, initial }: { mode: string; initial?: PostAdmin }) => (
    <div data-testid="editor-form" data-mode={mode} data-post-id={initial?.id} />
  ),
}));

import AdminEditPage from "../page";

function makePost(overrides: Partial<PostAdmin> = {}): PostAdmin {
  return {
    id: "my-post",
    title: "My Post",
    excerpt: "excerpt",
    tags: [],
    date: "2025-01-01",
    kind: "essay",
    content: "content",
    status: "draft",
    views: 0,
    readTime: "1분",
    createdAt: "2025-01-01T00:00:00Z",
    updatedAt: "2025-01-01T00:00:00Z",
    ...overrides,
  };
}

function makeParams(id: string) {
  return Promise.resolve({ id });
}

beforeEach(() => {
  mockAdminDetail.mockClear();
  mockNotFound.mockClear();
});

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

describe("AdminEditPage", () => {
  it("renders EditorForm with post data when adminDetail succeeds", async () => {
    mockAdminDetail.mockResolvedValue(makePost({ id: "my-post" }));
    const jsx = await AdminEditPage({ params: makeParams("my-post") });
    render(jsx);
    const form = screen.getByTestId("editor-form");
    expect(form).toHaveAttribute("data-mode", "edit");
    expect(form).toHaveAttribute("data-post-id", "my-post");
  });

  it("decodes URL-encoded params.id before calling adminDetail", async () => {
    const encodedId = "k8s-gateway-api-%EC%82%AC%EC%9A%A9%ED%95%98%EA%B8%B0";
    const decodedId = "k8s-gateway-api-사용하기";
    mockAdminDetail.mockResolvedValue(makePost({ id: decodedId }));
    await AdminEditPage({ params: makeParams(encodedId) });
    expect(mockAdminDetail).toHaveBeenCalledWith(decodedId);
    expect(mockAdminDetail).not.toHaveBeenCalledWith(encodedId);
  });

  it("calls adminDetail with already-decoded (ASCII) id unchanged", async () => {
    mockAdminDetail.mockResolvedValue(makePost({ id: "plain-post" }));
    await AdminEditPage({ params: makeParams("plain-post") });
    expect(mockAdminDetail).toHaveBeenCalledWith("plain-post");
  });

  it("calls notFound() when adminDetail throws ApiError 404", async () => {
    mockAdminDetail.mockRejectedValue(new ApiError("Not Found", 404, {}));
    await expect(AdminEditPage({ params: makeParams("missing") })).rejects.toThrow("NEXT_NOT_FOUND");
    expect(mockNotFound).toHaveBeenCalledOnce();
  });

  it("re-throws non-404 ApiError without calling notFound", async () => {
    mockAdminDetail.mockRejectedValue(new ApiError("Server Error", 500, {}));
    await expect(AdminEditPage({ params: makeParams("my-post") })).rejects.toThrow();
    expect(mockNotFound).not.toHaveBeenCalled();
  });

  it("calls notFound() when params.id contains malformed percent-encoding", async () => {
    await expect(AdminEditPage({ params: makeParams("bad-%E0%A4") })).rejects.toThrow("NEXT_NOT_FOUND");
    expect(mockNotFound).toHaveBeenCalledOnce();
    expect(mockAdminDetail).not.toHaveBeenCalled();
  });
});
