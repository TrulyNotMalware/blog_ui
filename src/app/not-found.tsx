import Link from "next/link";
import { ROUTES } from "@/constants";

export default function NotFound() {
  return (
    <div className="blog-frame">
      <div
        style={{
          padding: "80px 48px",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 14,
          textAlign: "center",
        }}
      >
        <div
          className="mono"
          style={{
            fontSize: 11,
            color: "var(--ink-4)",
            letterSpacing: "0.1em",
          }}
        >
          // 404
        </div>
        <h1 style={{ fontSize: 32, margin: 0, fontWeight: 600, letterSpacing: "-0.02em" }}>
          페이지를 찾을 수 없어요
        </h1>
        <p
          className="mono"
          style={{ fontSize: 13, color: "var(--ink-3)", margin: 0 }}
        >
          cat: $REQUEST_URI: No such file or directory
        </p>
        <Link
          href={ROUTES.HOME}
          className="btn btn-primary mono"
          style={{ marginTop: 16, textDecoration: "none" }}
        >
          ← cd /
        </Link>
      </div>
    </div>
  );
}
