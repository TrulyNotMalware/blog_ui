import { ImageResponse } from "next/og";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { APP_DESCRIPTION, APP_NAME } from "@/constants";

export const alt = `${APP_NAME} — ${APP_DESCRIPTION}`;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

// Hoist static I/O — load the Korean-capable font once; APP_DESCRIPTION contains Hangul.
const fontPromise = readFile(join(process.cwd(), "src/assets/fonts/Pretendard-Bold.otf"));

export default async function OpengraphImage() {
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
          fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 14, opacity: 0.6 }}>
          <span style={{ fontSize: 22 }}>~</span>
          <span style={{ fontSize: 22 }}>$</span>
          <span style={{ fontSize: 22 }}>cat ./notypiedev</span>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 22 }}>
          <div
            style={{
              fontSize: 96,
              fontWeight: 700,
              letterSpacing: "-0.04em",
              lineHeight: 1.05,
              maxWidth: 980,
            }}
          >
            {APP_NAME}
          </div>
          <div
            style={{
              fontSize: 30,
              opacity: 0.75,
              maxWidth: 900,
              lineHeight: 1.35,
              fontFamily: "Pretendard",
            }}
          >
            {APP_DESCRIPTION}
          </div>
        </div>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            fontSize: 20,
            opacity: 0.5,
          }}
        >
          <span>// a tech journal · written from a real desk</span>
          <span>notypiedev.com</span>
        </div>
      </div>
    ),
    {
      ...size,
      fonts: [{ name: "Pretendard", data: fontData, style: "normal", weight: 700 }],
    },
  );
}
