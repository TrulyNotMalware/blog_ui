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

vi.mock("next/headers", () => ({
  cookies: mockCookies,
}));

vi.mock("server-only", () => ({}));

import { POST, _resetRateLimiterForTest } from "../route";

beforeEach(() => {
  _resetRateLimiterForTest();
  vi.resetAllMocks();
  mockCookies.mockResolvedValue(mockCookieStore);
  vi.stubGlobal("fetch", vi.fn());
});

function makeRequest(body: unknown, extraHeaders?: Record<string, string>): Request {
  return new Request("http://localhost:3001/api/admin/auth/login", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      origin: "http://localhost:3001",
      ...extraHeaders,
    },
    body: JSON.stringify(body),
  });
}

function makeInvalidJsonRequest(): Request {
  return new Request("http://localhost:3001/api/admin/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json", origin: "http://localhost:3001" },
    body: "not-json{{{",
  });
}

function mockTokenPair(access = "access-tok", refresh = "refresh-tok"): void {
  (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue(
    new Response(JSON.stringify({ accessToken: access, refreshToken: refresh }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    }),
  );
}

describe("POST /api/admin/auth/login", () => {
  it("잘못된 JSON → 400 invalid_json", async () => {
    const res = await POST(makeInvalidJsonRequest());
    expect(res.status).toBe(400);
    expect((await res.json()).error).toBe("invalid_json");
  });

  it("username 누락 → 400 missing_credentials", async () => {
    const res = await POST(makeRequest({ password: "pw" }));
    expect(res.status).toBe(400);
    expect((await res.json()).error).toBe("missing_credentials");
  });

  it("password 누락 → 400 missing_credentials", async () => {
    const res = await POST(makeRequest({ username: "user" }));
    expect(res.status).toBe(400);
    expect((await res.json()).error).toBe("missing_credentials");
  });

  it("빈 username → 400 missing_credentials", async () => {
    const res = await POST(makeRequest({ username: "", password: "pw" }));
    expect(res.status).toBe(400);
    expect((await res.json()).error).toBe("missing_credentials");
  });

  it("BE fetch 실패 → 502 upstream_unreachable", async () => {
    (global.fetch as ReturnType<typeof vi.fn>).mockRejectedValue(new Error("ECONNREFUSED"));
    const res = await POST(makeRequest({ username: "user", password: "pw" }));
    expect(res.status).toBe(502);
    expect((await res.json()).error).toBe("upstream_unreachable");
  });

  it("BE 401 → 401 login_failed 전달", async () => {
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue(
      new Response(JSON.stringify({ detail: "wrong password" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      }),
    );
    const res = await POST(makeRequest({ username: "user", password: "wrong" }));
    expect(res.status).toBe(401);
    expect((await res.json()).error).toBe("login_failed");
  });

  it("BE 200 + token pair → 두 쿠키 설정 후 { ok: true }", async () => {
    mockTokenPair("acc-1", "ref-1");
    const res = await POST(makeRequest({ username: "user", password: "pw" }));
    expect(res.status).toBe(200);
    expect((await res.json()).ok).toBe(true);

    const calls = mockCookieStore.set.mock.calls.map((c) => c[0]);
    const access = calls.find((c) => c.name === "admin_access");
    const refresh = calls.find((c) => c.name === "admin_refresh");
    expect(access).toMatchObject({
      value: "acc-1",
      httpOnly: true,
      sameSite: "strict",
      maxAge: 60 * 15,
    });
    expect(refresh).toMatchObject({
      value: "ref-1",
      httpOnly: true,
      sameSite: "strict",
      maxAge: 60 * 60 * 24 * 7,
    });
  });

  it("개발 환경에서 secure: false", async () => {
    vi.stubEnv("NODE_ENV", "development");
    mockTokenPair();
    await POST(makeRequest({ username: "user", password: "pw" }));
    for (const call of mockCookieStore.set.mock.calls) {
      expect(call[0]).toMatchObject({ secure: false });
    }
    vi.unstubAllEnvs();
  });

  it("프로덕션 환경에서 secure: true", async () => {
    vi.stubEnv("NODE_ENV", "production");
    mockTokenPair();
    await POST(makeRequest({ username: "user", password: "pw" }));
    for (const call of mockCookieStore.set.mock.calls) {
      expect(call[0]).toMatchObject({ secure: true });
    }
    vi.unstubAllEnvs();
  });

  it("cookies()와 fetch가 병렬로 시작됨", async () => {
    let cookiesCalledBeforeFetchResolve = false;
    let resolveFetch!: (v: Response) => void;
    const fetchPromise = new Promise<Response>((resolve) => {
      resolveFetch = resolve;
    });

    (global.fetch as ReturnType<typeof vi.fn>).mockReturnValue(fetchPromise);
    mockCookies.mockImplementation(() => {
      cookiesCalledBeforeFetchResolve = true;
      return Promise.resolve(mockCookieStore);
    });

    const postPromise = POST(makeRequest({ username: "user", password: "pw" }));

    resolveFetch(
      new Response(JSON.stringify({ accessToken: "a", refreshToken: "r" }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }),
    );

    await postPromise;
    expect(cookiesCalledBeforeFetchResolve).toBe(true);
  });

  it("BE 200 + accessToken 누락 → 502 no_token_in_response", async () => {
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue(
      new Response(JSON.stringify({ refreshToken: "only" }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }),
    );
    const res = await POST(makeRequest({ username: "user", password: "pw" }));
    expect(res.status).toBe(502);
    expect((await res.json()).error).toBe("no_token_in_response");
  });

  it("BE 200 + refreshToken 누락 → 502 no_token_in_response", async () => {
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue(
      new Response(JSON.stringify({ accessToken: "only" }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }),
    );
    const res = await POST(makeRequest({ username: "user", password: "pw" }));
    expect(res.status).toBe(502);
    expect((await res.json()).error).toBe("no_token_in_response");
  });
});

describe("POST /api/admin/auth/login — CSRF gating", () => {
  it("mismatched Origin → 403, BE fetch not called", async () => {
    const req = new Request("http://localhost:3001/api/admin/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json", origin: "http://evil.example.com" },
      body: JSON.stringify({ username: "user", password: "pw" }),
    });
    const res = await POST(req);
    expect(res.status).toBe(403);
    expect((await res.json()).error).toBe("forbidden_cross_origin");
    expect(global.fetch as ReturnType<typeof vi.fn>).not.toHaveBeenCalled();
  });

  it("no Origin + no Referer → 403, BE fetch not called", async () => {
    const req = new Request("http://localhost:3001/api/admin/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username: "user", password: "pw" }),
    });
    const res = await POST(req);
    expect(res.status).toBe(403);
    expect((await res.json()).error).toBe("forbidden_cross_origin");
    expect(global.fetch as ReturnType<typeof vi.fn>).not.toHaveBeenCalled();
  });

  it("no Origin + same-origin Referer → continues to BE", async () => {
    mockTokenPair();
    const req = new Request("http://localhost:3001/api/admin/auth/login", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        referer: "http://localhost:3001/admin/login",
      },
      body: JSON.stringify({ username: "user", password: "pw" }),
    });
    const res = await POST(req);
    expect(res.status).toBe(200);
    expect(global.fetch as ReturnType<typeof vi.fn>).toHaveBeenCalled();
  });
});
