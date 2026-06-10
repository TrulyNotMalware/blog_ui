import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { getAbout, getIntro, mergeAbout, mergeIntro, DEFAULT_ABOUT, DEFAULT_INTRO } from "../contentService";

function mockFetch(status: number, body: unknown, contentType = "application/json") {
  const headers = new Headers({ "content-type": contentType });
  const response = {
    ok: status >= 200 && status < 300,
    status,
    statusText: status === 404 ? "Not Found" : "OK",
    headers,
    json: () => Promise.resolve(body),
    text: () => Promise.resolve(JSON.stringify(body)),
  } as unknown as Response;
  vi.spyOn(global, "fetch").mockResolvedValue(response);
}

beforeEach(() => {
  vi.spyOn(global, "fetch").mockReset?.();
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("getAbout", () => {
  it("404 → returns DEFAULT_ABOUT", async () => {
    mockFetch(404, { detail: "not found" });
    const result = await getAbout();
    expect(result).toEqual(DEFAULT_ABOUT);
  });

  it("network error → returns DEFAULT_ABOUT", async () => {
    vi.spyOn(global, "fetch").mockRejectedValue(new Error("Network failure"));
    const result = await getAbout();
    expect(result).toEqual(DEFAULT_ABOUT);
  });

  it("success → returns fetched content", async () => {
    const fetched = {
      headline: "Custom headline",
      paragraphs: ["Para one.", "Para two."],
      now: [{ type: "building", text: "something" }],
      stack: [{ key: "lang", value: "Go" }],
      contact: [{ label: "email", value: "a@b.com" }],
    };
    mockFetch(200, { key: "about", content: fetched, updatedAt: "2026-01-01T00:00:00Z" });
    const result = await getAbout();
    expect(result.headline).toBe("Custom headline");
    expect(result.paragraphs).toEqual(["Para one.", "Para two."]);
    expect(result.now).toEqual([{ type: "building", text: "something" }]);
  });

  it("partial content: missing now → falls back to DEFAULT_ABOUT.now per-field", async () => {
    const partial = {
      headline: "H",
      paragraphs: ["P"],
      now: [],        // empty → falls back to default
      stack: [{ key: "k", value: "v" }],
      contact: [{ label: "l", value: "v" }],
    };
    mockFetch(200, { key: "about", content: partial, updatedAt: "2026-01-01T00:00:00Z" });
    const result = await getAbout();
    expect(result.now).toEqual(DEFAULT_ABOUT.now);
    expect(result.headline).toBe("H");
    expect(result.stack).toEqual([{ key: "k", value: "v" }]);
  });

  it("non-object content → returns DEFAULT_ABOUT", async () => {
    mockFetch(200, { key: "about", content: "bad-string", updatedAt: "2026-01-01T00:00:00Z" });
    const result = await getAbout();
    expect(result).toEqual(DEFAULT_ABOUT);
  });
});

describe("getIntro", () => {
  it("404 → returns DEFAULT_INTRO", async () => {
    mockFetch(404, { detail: "not found" });
    const result = await getIntro();
    expect(result).toEqual(DEFAULT_INTRO);
  });

  it("network error → returns DEFAULT_INTRO", async () => {
    vi.spyOn(global, "fetch").mockRejectedValue(new Error("Network failure"));
    const result = await getIntro();
    expect(result).toEqual(DEFAULT_INTRO);
  });

  it("success → returns fetched lines", async () => {
    const fetched = { lines: ["Line A", "Line B", "Line C"] };
    mockFetch(200, { key: "intro", content: fetched, updatedAt: "2026-01-01T00:00:00Z" });
    const result = await getIntro();
    expect(result.lines).toEqual(["Line A", "Line B", "Line C"]);
  });

  it("empty lines array → falls back to DEFAULT_INTRO.lines", async () => {
    mockFetch(200, { key: "intro", content: { lines: [] }, updatedAt: "2026-01-01T00:00:00Z" });
    const result = await getIntro();
    expect(result.lines).toEqual(DEFAULT_INTRO.lines);
  });

  it("non-object content → returns DEFAULT_INTRO", async () => {
    mockFetch(200, { key: "intro", content: 42, updatedAt: "2026-01-01T00:00:00Z" });
    const result = await getIntro();
    expect(result).toEqual(DEFAULT_INTRO);
  });
});

// ─────────────────────────────────────────────
// mergeAbout — element-level validation
// ─────────────────────────────────────────────
describe("mergeAbout", () => {
  it("null → returns DEFAULT_ABOUT", () => {
    expect(mergeAbout(null)).toEqual(DEFAULT_ABOUT);
  });

  it("undefined → returns DEFAULT_ABOUT", () => {
    expect(mergeAbout(undefined)).toEqual(DEFAULT_ABOUT);
  });

  it("non-object (string) → returns DEFAULT_ABOUT", () => {
    expect(mergeAbout("bad")).toEqual(DEFAULT_ABOUT);
  });

  it("non-object (array) → returns DEFAULT_ABOUT", () => {
    expect(mergeAbout([])).toEqual(DEFAULT_ABOUT);
  });

  it("paragraphs:[{}] → filters out non-strings, falls back to DEFAULT_ABOUT.paragraphs", () => {
    const result = mergeAbout({
      headline: "H",
      paragraphs: [{}],
      now: [{ type: "building", text: "x" }],
      stack: [{ key: "k", value: "v" }],
      contact: [{ label: "l", value: "v" }],
    });
    expect(result.paragraphs).toEqual(DEFAULT_ABOUT.paragraphs);
    expect(result.headline).toBe("H");
  });

  it("paragraphs with mixed valid/invalid → keeps only strings", () => {
    const result = mergeAbout({
      headline: "H",
      paragraphs: ["valid", {}, null, "also valid"],
      now: [{ type: "t", text: "x" }],
      stack: [{ key: "k", value: "v" }],
      contact: [{ label: "l", value: "v" }],
    });
    expect(result.paragraphs).toEqual(["valid", "also valid"]);
  });

  it("now:[{}] → filters out items missing required string props, falls back to DEFAULT_ABOUT.now", () => {
    const result = mergeAbout({
      headline: "H",
      paragraphs: ["p"],
      now: [{}],
      stack: [{ key: "k", value: "v" }],
      contact: [{ label: "l", value: "v" }],
    });
    expect(result.now).toEqual(DEFAULT_ABOUT.now);
  });

  it("now with wrong-typed props → filtered out, falls back to default", () => {
    const result = mergeAbout({
      headline: "H",
      paragraphs: ["p"],
      now: [{ type: 1, text: "x" }, { type: "t", text: 2 }],
      stack: [{ key: "k", value: "v" }],
      contact: [{ label: "l", value: "v" }],
    });
    expect(result.now).toEqual(DEFAULT_ABOUT.now);
  });

  it("stack with wrong-typed props → filtered out, falls back to default", () => {
    const result = mergeAbout({
      headline: "H",
      paragraphs: ["p"],
      now: [{ type: "t", text: "x" }],
      stack: [{ key: 1, value: "v" }, { key: "k", value: null }],
      contact: [{ label: "l", value: "v" }],
    });
    expect(result.stack).toEqual(DEFAULT_ABOUT.stack);
  });

  it("contact with wrong-typed props → filtered out, falls back to default", () => {
    const result = mergeAbout({
      headline: "H",
      paragraphs: ["p"],
      now: [{ type: "t", text: "x" }],
      stack: [{ key: "k", value: "v" }],
      contact: [{ label: 1, value: "v" }],
    });
    expect(result.contact).toEqual(DEFAULT_ABOUT.contact);
  });

  it("headline empty string → falls back to DEFAULT_ABOUT.headline", () => {
    const result = mergeAbout({
      headline: "",
      paragraphs: ["p"],
      now: [{ type: "t", text: "x" }],
      stack: [{ key: "k", value: "v" }],
      contact: [{ label: "l", value: "v" }],
    });
    expect(result.headline).toBe(DEFAULT_ABOUT.headline);
  });

  it("fully valid object → returns as-is", () => {
    const input = {
      headline: "My headline",
      paragraphs: ["Para 1", "Para 2"],
      now: [{ type: "building", text: "something" }],
      stack: [{ key: "lang", value: "Go" }],
      contact: [{ label: "email", value: "a@b.com" }],
    };
    expect(mergeAbout(input)).toEqual(input);
  });
});

// ─────────────────────────────────────────────
// mergeIntro — element-level validation
// ─────────────────────────────────────────────
describe("mergeIntro", () => {
  it("null → returns DEFAULT_INTRO", () => {
    expect(mergeIntro(null)).toEqual(DEFAULT_INTRO);
  });

  it("undefined → returns DEFAULT_INTRO", () => {
    expect(mergeIntro(undefined)).toEqual(DEFAULT_INTRO);
  });

  it("non-object → returns DEFAULT_INTRO", () => {
    expect(mergeIntro(42)).toEqual(DEFAULT_INTRO);
  });

  it("lines:[{}] → filters out non-strings, falls back to DEFAULT_INTRO.lines", () => {
    const result = mergeIntro({ lines: [{}] });
    expect(result.lines).toEqual(DEFAULT_INTRO.lines);
  });

  it("lines:[{}, 'ok'] → keeps only string elements", () => {
    const result = mergeIntro({ lines: [{}, "ok", null, "also ok"] });
    expect(result.lines).toEqual(["ok", "also ok"]);
  });

  it("lines:[] → falls back to DEFAULT_INTRO.lines", () => {
    const result = mergeIntro({ lines: [] });
    expect(result.lines).toEqual(DEFAULT_INTRO.lines);
  });

  it("lines with all non-strings → falls back to DEFAULT_INTRO.lines", () => {
    const result = mergeIntro({ lines: [1, null, {}, true] });
    expect(result.lines).toEqual(DEFAULT_INTRO.lines);
  });

  it("valid lines → returns them", () => {
    const result = mergeIntro({ lines: ["Line A", "Line B"] });
    expect(result.lines).toEqual(["Line A", "Line B"]);
  });
});
