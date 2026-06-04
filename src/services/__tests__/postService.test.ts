import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { postService } from "../postService";
import { ApiError } from "@/api/client";

function mockFetch(status: number, body: unknown, contentType = "application/json") {
  const headers = new Headers({ "content-type": contentType });
  const response = {
    ok: status >= 200 && status < 300,
    status,
    statusText: status === 401 ? "Unauthorized" : status === 404 ? "Not Found" : "OK",
    headers,
    json: () => Promise.resolve(body),
    text: () => Promise.resolve(String(body)),
  } as unknown as Response;
  vi.spyOn(global, "fetch").mockResolvedValue(response);
}

beforeEach(() => {
  vi.spyOn(global, "fetch").mockReset?.();
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("postService admin methods", () => {
  describe("adminList", () => {
    it("calls /api/admin/posts with GET and credentials same-origin", async () => {
      mockFetch(200, { items: [], total: 0, page: 1, pageSize: 20, hasNext: false });
      await postService.adminList();
      expect(fetch).toHaveBeenCalledOnce();
      const [url, init] = (fetch as ReturnType<typeof vi.fn>).mock.calls[0];
      expect(url).toBe("/api/admin/posts");
      expect(init.credentials).toBe("same-origin");
    });

    it("appends status and pageSize query params", async () => {
      mockFetch(200, { items: [], total: 0, page: 1, pageSize: 50, hasNext: false });
      await postService.adminList({ status: "draft", pageSize: 50 });
      const [url] = (fetch as ReturnType<typeof vi.fn>).mock.calls[0];
      expect(url).toBe("/api/admin/posts?status=draft&pageSize=50");
    });

    it("strips undefined and empty params from query string", async () => {
      mockFetch(200, { items: [], total: 0, page: 1, pageSize: 20, hasNext: false });
      await postService.adminList({ status: undefined, tag: "" });
      const [url] = (fetch as ReturnType<typeof vi.fn>).mock.calls[0];
      expect(url).toBe("/api/admin/posts");
    });
  });

  describe("adminDetail", () => {
    it("calls /api/admin/posts/:id with GET", async () => {
      mockFetch(200, { id: "foo" });
      await postService.adminDetail("foo");
      const [url, init] = (fetch as ReturnType<typeof vi.fn>).mock.calls[0];
      expect(url).toBe("/api/admin/posts/foo");
      expect(init.method).toBeUndefined(); // default GET (no method set)
      expect(init.credentials).toBe("same-origin");
    });

    it("percent-encodes URL-special chars in id", async () => {
      mockFetch(200, { id: "a/b&c" });
      await postService.adminDetail("a/b&c");
      const [url] = (fetch as ReturnType<typeof vi.fn>).mock.calls[0];
      expect(url).toBe("/api/admin/posts/a%2Fb%26c");
    });
  });

  describe("create", () => {
    it("calls /api/admin/posts with POST and JSON body", async () => {
      const post = { id: "new-post", title: "New Post", status: "draft" as const };
      mockFetch(201, { ...post });
      await postService.create(post);
      const [url, init] = (fetch as ReturnType<typeof vi.fn>).mock.calls[0];
      expect(url).toBe("/api/admin/posts");
      expect(init.method).toBe("POST");
      expect(JSON.parse(init.body as string)).toMatchObject(post);
      expect(init.credentials).toBe("same-origin");
    });
  });

  describe("update", () => {
    it("calls /api/admin/posts/:id with PATCH and JSON body", async () => {
      const payload = { title: "Updated" };
      mockFetch(200, { id: "foo", title: "Updated" });
      await postService.update("foo", payload);
      const [url, init] = (fetch as ReturnType<typeof vi.fn>).mock.calls[0];
      expect(url).toBe("/api/admin/posts/foo");
      expect(init.method).toBe("PATCH");
      expect(JSON.parse(init.body as string)).toMatchObject(payload);
    });
  });

  describe("remove", () => {
    it("calls /api/admin/posts/:id with DELETE and returns when 204", async () => {
      // 204 No Content — no JSON body
      const headers = new Headers({ "content-type": "text/plain" });
      vi.spyOn(global, "fetch").mockResolvedValue({
        ok: true,
        status: 204,
        statusText: "No Content",
        headers,
        json: () => Promise.resolve(null),
        text: () => Promise.resolve(""),
      } as unknown as Response);
      const result = await postService.remove("foo");
      const [url, init] = (fetch as ReturnType<typeof vi.fn>).mock.calls[0];
      expect(url).toBe("/api/admin/posts/foo");
      expect(init.method).toBe("DELETE");
      expect(result).toBeNull();
    });
  });

  describe("publish", () => {
    it("calls /api/admin/posts/:id/publish with POST", async () => {
      mockFetch(200, { id: "foo", status: "published" });
      await postService.publish("foo");
      const [url, init] = (fetch as ReturnType<typeof vi.fn>).mock.calls[0];
      expect(url).toBe("/api/admin/posts/foo/publish");
      expect(init.method).toBe("POST");
    });
  });

  describe("error handling", () => {
    it("throws ApiError with status 401 on 401 response", async () => {
      mockFetch(401, { detail: "Unauthorized" });
      await expect(postService.adminList()).rejects.toThrow(ApiError);
      await expect(postService.adminList()).rejects.toMatchObject({ status: 401 });
    });

    it("throws ApiError with status 404 on 404 response", async () => {
      mockFetch(404, { detail: "Not Found" });
      await expect(postService.adminDetail("missing")).rejects.toThrow(ApiError);
      await expect(postService.adminDetail("missing")).rejects.toMatchObject({ status: 404 });
    });
  });
});
