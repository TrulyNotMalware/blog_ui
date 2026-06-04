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
import { GET, POST } from "../route";

beforeEach(() => {
  vi.resetAllMocks();
  mockForward.mockResolvedValue(Response.json({ ok: true }));
});

function makeNextRequest(
  url: string,
  method: string,
  body?: unknown,
  headers?: Record<string, string>,
): NextRequest {
  return new NextRequest(new URL(url), {
    method,
    headers: { "Content-Type": "application/json", ...headers },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
}

describe("GET /api/admin/posts", () => {
  it("forwardToBeAsAdmin를 GET + admin/posts로 호출", async () => {
    const req = makeNextRequest(
      "http://localhost:3001/api/admin/posts?page=2&size=10",
      "GET",
    );
    await GET(req);

    expect(mockForward).toHaveBeenCalledWith(
      expect.objectContaining({
        method: "GET",
        bePath: "admin/posts",
      }),
    );
  });

  it("search params를 전달", async () => {
    const req = makeNextRequest(
      "http://localhost:3001/api/admin/posts?page=2",
      "GET",
    );
    await GET(req);

    const call = mockForward.mock.calls[0][0];
    expect(call.search?.get("page")).toBe("2");
  });
});

describe("POST /api/admin/posts", () => {
  it("forwardToBeAsAdmin를 POST + posts(BE 경로)로 호출", async () => {
    const req = makeNextRequest(
      "http://localhost:3001/api/admin/posts",
      "POST",
      { title: "New Post", content: "..." },
      { origin: "http://localhost:3001" },
    );
    await POST(req);

    expect(mockForward).toHaveBeenCalledWith(
      expect.objectContaining({
        method: "POST",
        bePath: "posts",
        body: { title: "New Post", content: "..." },
        request: req,
      }),
    );
  });

  it("잘못된 JSON body → 400 invalid_json, forwardToBeAsAdmin 미호출", async () => {
    const req = new NextRequest(
      new URL("http://localhost:3001/api/admin/posts"),
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: "not-json{{{",
      },
    );
    const res = await POST(req);

    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toBe("invalid_json");
    expect(mockForward).not.toHaveBeenCalled();
  });
});
