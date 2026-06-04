import type { Post, Tag } from "@/types";

// XML escape helpers retained for sitemap generation; the RSS feed builder was
// removed when the subscribe feature was dropped from the site.


// XML 1.0 valid chars: #x9 | #xA | #xD | [#x20-#xD7FF] | [#xE000-#xFFFD] | [#x10000-#x10FFFF].
// Strip everything else (e.g. backspace) before emitting into XML payloads,
// otherwise xmllint will reject the document as malformed.
const INVALID_XML_CHARS =
  /[^\t\n\r -퟿-�\u{10000}-\u{10FFFF}]/gu;

export function stripInvalidXmlChars(value: string): string {
  return value.replace(INVALID_XML_CHARS, "");
}

export function escapeXml(value: string): string {
  return stripInvalidXmlChars(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

export function postUrl(siteUrl: string, id: string): string {
  return `${siteUrl}/posts/${encodeURIComponent(id)}`;
}

export function tagUrl(siteUrl: string, name: string): string {
  return `${siteUrl}/tags/${encodeURIComponent(name)}`;
}

export function toUtcDate(input: string | undefined): Date {
  if (!input) return new Date(0);
  const d = new Date(input);
  return Number.isNaN(d.getTime()) ? new Date(0) : d;
}

export type ChangeFrequency =
  | "always"
  | "hourly"
  | "daily"
  | "weekly"
  | "monthly"
  | "yearly"
  | "never";

export interface SitemapEntry {
  url: string;
  lastModified: Date;
  changeFrequency: ChangeFrequency;
  priority: number;
}

export interface SitemapInput {
  siteUrl: string;
  posts: Post[];
  tags: Tag[];
  now?: Date;
}

export function buildSitemap({ siteUrl, posts, tags, now }: SitemapInput): SitemapEntry[] {
  const ts = now ?? new Date();
  const staticPages: SitemapEntry[] = [
    { url: `${siteUrl}/`, lastModified: ts, changeFrequency: "daily", priority: 1 },
    { url: `${siteUrl}/tags`, lastModified: ts, changeFrequency: "weekly", priority: 0.8 },
    { url: `${siteUrl}/about`, lastModified: ts, changeFrequency: "monthly", priority: 0.5 },
  ];
  const tagPages: SitemapEntry[] = tags.map((t) => ({
    url: tagUrl(siteUrl, t.name),
    lastModified: ts,
    changeFrequency: "weekly",
    priority: 0.6,
  }));
  const postPages: SitemapEntry[] = posts.map((p) => ({
    url: postUrl(siteUrl, p.id),
    lastModified: toUtcDate(p.date),
    changeFrequency: "monthly",
    priority: 0.7,
  }));
  return [...staticPages, ...tagPages, ...postPages];
}
