import { ImageResponse } from "next/og";
import { notFound } from "next/navigation";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { ApiError } from "@/api/client";
import { APP_NAME } from "@/constants";
import { postService } from "@/services/postService";

export const alt = "post preview";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
// Match the parent post page's revalidate so OG image and HTML refresh together.
export const revalidate = 60;

// Hoist static I/O — load the Korean-capable font once per server instance.
// Pretendard is licensed under SIL OFL 1.1; see src/assets/fonts/Pretendard-LICENSE.txt.
const FONT_PATH = join(process.cwd(), "src/assets/fonts/Pretendard-Bold.otf");
const fontPromise = readFile(FONT_PATH);

interface ImageProps {
  params: Promise<{ id: string }>;
}

export default async function Image({ params }: ImageProps) {
  const { id } = await params;

  let title = id;
  let tags: string[] = [];
  let date = "";
  try {
    const post = await postService.detail(id);
    title = post.title;
    tags = post.tags ?? [];
    date = post.date ?? "";
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) notFound();
    console.error("[opengraph-image] post fetch failed", error);
    // fall through with id as title for transient failures
  }

  const fontData = await fontPromise;

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "72px 80px",
          background: "#0e0e10",
          color: "#fafafa",
          fontFamily: "Pretendard",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 14,
            fontSize: 22,
            opacity: 0.55,
            fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
          }}
        >
          <span>{date || "—"}</span>
          <span>·</span>
          <span>{APP_NAME}</span>
        </div>
        <div
          style={{
            fontSize: 72,
            fontWeight: 700,
            letterSpacing: "-0.03em",
            lineHeight: 1.15,
            maxWidth: 1040,
            display: "flex",
          }}
        >
          {title.length > 90 ? title.slice(0, 90) + "…" : title}
        </div>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 14,
            fontSize: 22,
            opacity: 0.55,
            fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
          }}
        >
          <span>{tags.map((t) => `#${t}`).join("  ")}</span>
          <span style={{ marginLeft: "auto" }}>/posts/{id.length > 40 ? id.slice(0, 40) + "…" : id}.md</span>
        </div>
      </div>
    ),
    {
      ...size,
      fonts: [{ name: "Pretendard", data: fontData, style: "normal", weight: 700 }],
    },
  );
}
