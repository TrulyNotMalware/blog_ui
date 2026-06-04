"use client";

import { useEffect } from "react";

interface ErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function Error({ error, reset }: ErrorProps) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="blog-frame">
      <div style={{ padding: "60px 48px", display: "flex", flexDirection: "column", gap: 14 }}>
        <div
          className="mono"
          style={{
            fontSize: 11,
            color: "var(--ink-4)",
            letterSpacing: "0.1em",
          }}
        >
          // error
        </div>
        <h2 style={{ fontSize: 22, margin: 0, fontWeight: 600 }}>문제가 발생했어요</h2>
        <p
          className="mono"
          style={{ fontSize: 13, color: "var(--ink-3)", margin: 0 }}
        >
          {error.message}
        </p>
        <button
          type="button"
          onClick={reset}
          className="btn"
          style={{ alignSelf: "flex-start", marginTop: 8 }}
        >
          다시 시도
        </button>
      </div>
    </div>
  );
}
