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
import { DELETE, GET, PATCH } from "../route";

beforeEach(() => {
  vi.resetAllMocks();
  mockForward.mockResolvedValue(Response.json({ ok: true }));
});

function makeCtx(id: string) {
  return { params: Promise.resolve({ id }) };
}

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

describe("GET /api/admin/posts/[id]", () => {
  it("forwardToBeAsAdmin를 GET + admin/posts/{id}로 호출", async () => {
    const req = makeNextRequest(
      "http://localhost:3001/api/admin/posts/abc123",
      "GET",
    );
    await GET(req, makeCtx("abc123"));

    expect(mockForward).toHaveBeenCalledWith(
      expect.objectContaining({
        method: "GET",
        bePath: "admin/posts/abc123",
      }),
    );
  });

  it("id를 URL 인코딩해서 전달", async () => {
    const req = makeNextRequest(
      "http://localhost:3001/api/admin/posts/hello%20world",
      "GET",
    );
    await GET(req, makeCtx("hello world"));

    const call = mockForward.mock.calls[0][0];
    expect(call.bePath).toBe("admin/posts/hello%20world");
  });

  it("GET detail은 search 없이 호출", async () => {
    const req = makeNextRequest(
      "http://localhost:3001/api/admin/posts/abc",
      "GET",
    );
    await GET(req, makeCtx("abc"));

    const call = mockForward.mock.calls[0][0];
    expect(call.search).toBeUndefined();
  });
});

describe("PATCH /api/admin/posts/[id]", () => {
  it("forwardToBeAsAdmin를 PATCH + posts/{id}로 호출", async () => {
    const req = makeNextRequest(
      "http://localhost:3001/api/admin/posts/abc123",
      "PATCH",
      { title: "Updated" },
      { origin: "http://localhost:3001" },
    );
    await PATCH(req, makeCtx("abc123"));

    expect(mockForward).toHaveBeenCalledWith(
      expect.objectContaining({
        method: "PATCH",
        bePath: "posts/abc123",
        body: { title: "Updated" },
        request: req,
      }),
    );
  });

  it("잘못된 JSON body → 400 invalid_json, forwardToBeAsAdmin 미호출", async () => {
    const req = new NextRequest(
      new URL("http://localhost:3001/api/admin/posts/abc123"),
      {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: "not-json{{{",
      },
    );
    const res = await PATCH(req, makeCtx("abc123"));

    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toBe("invalid_json");
    expect(mockForward).not.toHaveBeenCalled();
  });
});

describe("DELETE /api/admin/posts/[id]", () => {
  it("forwardToBeAsAdmin를 DELETE + posts/{id}로 호출", async () => {
    const req = makeNextRequest(
      "http://localhost:3001/api/admin/posts/abc123",
      "DELETE",
    );
    await DELETE(req, makeCtx("abc123"));

    expect(mockForward).toHaveBeenCalledWith(
      expect.objectContaining({
        method: "DELETE",
        bePath: "posts/abc123",
        request: req,
      }),
    );
  });
});
