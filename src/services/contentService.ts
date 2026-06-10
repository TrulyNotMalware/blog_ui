import { ApiError, apiClient } from "@/api/client";
import { endpoints } from "@/api/endpoints";

export const CONTENT_REVALIDATE_SECONDS = 60;
export const CONTENT_CACHE_TAG = "content";

const PUBLIC_READ_CACHE = {
  next: { revalidate: CONTENT_REVALIDATE_SECONDS, tags: [CONTENT_CACHE_TAG] },
};

export interface AboutContent {
  headline: string;
  paragraphs: string[];
  now: { type: string; text: string }[];
  stack: { key: string; value: string }[];
  contact: { label: string; value: string }[];
}

export interface IntroContent {
  lines: string[];
}

export const DEFAULT_ABOUT: AboutContent = {
  headline: "나는 만드는 것에 대해 쓴다.",
  paragraphs: [
    "notypiedev는 백엔드, 인프라, 그리고 그 사이의 어색한 영역에 대한 기록이다. 화려한 비교 글이나 `10 things you didn't know` 같은 건 없다.",
    "대신 — 직접 부딪힌 문제, 잘못된 결정과 그걸 알아챈 순간, 다음에 다르게 할 것들에 대해 쓴다. 정직하게.",
  ],
  now: [
    { type: "building", text: "notypiedev blog engine (this site)" },
    { type: "building", text: "pgmeter — Postgres 쿼리 시각화 도구" },
    { type: "writing", text: "OAuth 2.1 구현 가이드 (책, 진행 40%)" },
    { type: "reading", text: "Designing Data-Intensive Apps (다시)" },
  ],
  stack: [
    { key: "languages", value: "TypeScript · Go · Python · SQL" },
    { key: "runtimes", value: "Bun · Node · Cloudflare Workers" },
    { key: "db", value: "Postgres · SQLite · Redis" },
    { key: "infra", value: "fly.io · cloudflare · litestream" },
    { key: "editor", value: "Neovim · Helix (시도 중)" },
  ],
  contact: [
    { label: "email", value: "notleebutyee@gmail.com" },
    { label: "github", value: "@TrulyNotMalware" },
  ],
};

export const DEFAULT_INTRO: IntroContent = {
  lines: [
    "인프라, 백엔드, 그리고 그 사이의 어색한 영역에 대한 글.",
    "아무도 안 시켰지만 쓴다.",
  ],
};

function isObject(v: unknown): v is Record<string, unknown> {
  return !!v && typeof v === "object" && !Array.isArray(v);
}

interface ContentResponse<T> {
  key: string;
  content: T;
  updatedAt: string;
}

/** Merges a raw unknown value into a valid AboutContent, applying element-level validation.
 * Any field that is missing, wrong type, or produces an empty array after filtering
 * falls back to the corresponding DEFAULT_ABOUT field. */
export function mergeAbout(raw: unknown): AboutContent {
  if (!isObject(raw)) return DEFAULT_ABOUT;

  const headline =
    typeof raw.headline === "string" && raw.headline
      ? raw.headline
      : DEFAULT_ABOUT.headline;

  const paragraphsRaw = Array.isArray(raw.paragraphs)
    ? (raw.paragraphs as unknown[]).filter((x): x is string => typeof x === "string" && x.length > 0)
    : [];
  const paragraphs = paragraphsRaw.length ? paragraphsRaw : DEFAULT_ABOUT.paragraphs;

  const nowRaw = Array.isArray(raw.now)
    ? (raw.now as unknown[]).filter(
        (x): x is { type: string; text: string } =>
          isObject(x) && typeof x.type === "string" && typeof x.text === "string",
      )
    : [];
  const now = nowRaw.length ? nowRaw : DEFAULT_ABOUT.now;

  const stackRaw = Array.isArray(raw.stack)
    ? (raw.stack as unknown[]).filter(
        (x): x is { key: string; value: string } =>
          isObject(x) && typeof x.key === "string" && typeof x.value === "string",
      )
    : [];
  const stack = stackRaw.length ? stackRaw : DEFAULT_ABOUT.stack;

  const contactRaw = Array.isArray(raw.contact)
    ? (raw.contact as unknown[]).filter(
        (x): x is { label: string; value: string } =>
          isObject(x) && typeof x.label === "string" && typeof x.value === "string",
      )
    : [];
  const contact = contactRaw.length ? contactRaw : DEFAULT_ABOUT.contact;

  return { headline, paragraphs, now, stack, contact };
}

/** Merges a raw unknown value into a valid IntroContent, applying element-level validation.
 * Non-string elements are filtered out; empty result falls back to DEFAULT_INTRO.lines. */
export function mergeIntro(raw: unknown): IntroContent {
  if (!isObject(raw)) return DEFAULT_INTRO;

  const linesRaw = Array.isArray(raw.lines)
    ? (raw.lines as unknown[]).filter((x): x is string => typeof x === "string" && x.length > 0)
    : [];
  const lines = linesRaw.length ? linesRaw : DEFAULT_INTRO.lines;

  return { lines };
}

export async function getAbout(): Promise<AboutContent> {
  try {
    const resp = await apiClient.get<ContentResponse<unknown>>(
      endpoints.content.detail("about"),
      { ...PUBLIC_READ_CACHE },
    );
    return mergeAbout(resp.content);
  } catch (err) {
    if (err instanceof ApiError && err.status === 404) return DEFAULT_ABOUT;
    // Network error or unexpected failure — return default, never throw to page
    return DEFAULT_ABOUT;
  }
}

export async function getIntro(): Promise<IntroContent> {
  try {
    const resp = await apiClient.get<ContentResponse<unknown>>(
      endpoints.content.detail("intro"),
      { ...PUBLIC_READ_CACHE },
    );
    return mergeIntro(resp.content);
  } catch (err) {
    if (err instanceof ApiError && err.status === 404) return DEFAULT_INTRO;
    return DEFAULT_INTRO;
  }
}
