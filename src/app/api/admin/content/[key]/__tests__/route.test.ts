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
import { GET, PUT } from "../route";

beforeEach(() => {
  vi.resetAllMocks();
  mockForward.mockResolvedValue(Response.json({ ok: true }));
});

function makeCtx(key: string) {
  return { params: Promise.resolve({ key }) };
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

describe("GET /api/admin/content/[key]", () => {
  it("forwardToBeAsAdmin를 GET + content/{key}로 호출", async () => {
    const req = makeNextRequest(
      "http://localhost:3001/api/admin/content/about",
      "GET",
    );
    await GET(req, makeCtx("about"));

    expect(mockForward).toHaveBeenCalledWith(
      expect.objectContaining({
        method: "GET",
        bePath: "content/about",
      }),
    );
  });

  it("key를 URL 인코딩해서 전달", async () => {
    const req = makeNextRequest(
      "http://localhost:3001/api/admin/content/hello%20world",
      "GET",
    );
    await GET(req, makeCtx("hello world"));

    const call = mockForward.mock.calls[0][0];
    expect(call.bePath).toBe("content/hello%20world");
  });

  it("origin guard: forwardToBeAsAdmin에 request 전달", async () => {
    const req = makeNextRequest(
      "http://localhost:3001/api/admin/content/intro",
      "GET",
      undefined,
      { origin: "http://localhost:3001" },
    );
    await GET(req, makeCtx("intro"));

    const call = mockForward.mock.calls[0][0];
    expect(call.request).toBe(req);
  });
});

describe("PUT /api/admin/content/[key]", () => {
  it("forwardToBeAsAdmin를 PUT + content/{key} + body로 호출", async () => {
    const body = { content: { lines: ["line1", "line2"] } };
    const req = makeNextRequest(
      "http://localhost:3001/api/admin/content/intro",
      "PUT",
      body,
      { origin: "http://localhost:3001" },
    );
    await PUT(req, makeCtx("intro"));

    expect(mockForward).toHaveBeenCalledWith(
      expect.objectContaining({
        method: "PUT",
        bePath: "content/intro",
        body,
        request: req,
      }),
    );
  });

  it("content 태그로 revalidateTags 전달", async () => {
    const req = makeNextRequest(
      "http://localhost:3001/api/admin/content/about",
      "PUT",
      { content: {} },
      { origin: "http://localhost:3001" },
    );
    await PUT(req, makeCtx("about"));

    const call = mockForward.mock.calls[0][0];
    expect(call.revalidateTags).toEqual(["content"]);
  });

  it("잘못된 JSON body → 400 invalid_json, forwardToBeAsAdmin 미호출", async () => {
    const req = new NextRequest(
      new URL("http://localhost:3001/api/admin/content/about"),
      {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: "not-json{{{",
      },
    );
    const res = await PUT(req, makeCtx("about"));

    expect(res.status).toBe(400);
    const resBody = await res.json();
    expect(resBody.error).toBe("invalid_json");
    expect(mockForward).not.toHaveBeenCalled();
  });
});
