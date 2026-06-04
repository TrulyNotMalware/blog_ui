import { beforeEach, describe, expect, it, vi } from "vitest";

const { mockForward } = vi.hoisted(() => {
  const mockForward = vi.fn();
  return { mockForward };
});

vi.mock("@/server/adminProxy", () => ({
  forwardToBeAsAdmin: mockForward,
  ADMIN_COOKIE_NAME: "admin_access",
  buildBeUrl: vi.fn((path: string) => `http://localhost:3000/api/${path}`),
}));

vi.mock("server-only", () => ({}));

import { NextRequest } from "next/server";
import { POST } from "../route";

beforeEach(() => {
  vi.resetAllMocks();
  mockForward.mockResolvedValue(Response.json({ ok: true }));
});

function makeCtx(id: string) {
  return { params: Promise.resolve({ id }) };
}

describe("POST /api/admin/posts/[id]/publish", () => {
  it("forwardToBeAsAdmin를 POST + posts/{id}/publish로 호출", async () => {
    const req = new NextRequest(
      new URL("http://localhost:3001/api/admin/posts/abc123/publish"),
      {
        method: "POST",
        headers: { origin: "http://localhost:3001" },
      },
    );
    await POST(req, makeCtx("abc123"));

    expect(mockForward).toHaveBeenCalledWith(
      expect.objectContaining({
        method: "POST",
        bePath: "posts/abc123/publish",
        request: req,
      }),
    );
  });

  it("id를 URL 인코딩해서 전달", async () => {
    const req = new NextRequest(
      new URL("http://localhost:3001/api/admin/posts/hello%20world/publish"),
      {
        method: "POST",
        headers: { origin: "http://localhost:3001" },
      },
    );
    await POST(req, makeCtx("hello world"));

    const call = mockForward.mock.calls[0][0];
    expect(call.bePath).toBe("posts/hello%20world/publish");
  });
});
