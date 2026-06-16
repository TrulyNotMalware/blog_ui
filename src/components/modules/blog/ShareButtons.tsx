"use client";

import { useEffect, useState } from "react";

interface ShareButtonsProps {
  postId: string;
}

export function ShareButtons({ postId }: ShareButtonsProps) {
  const [copied, setCopied] = useState(false);
  const [url, setUrl] = useState("");

  useEffect(() => {
    setUrl(`${window.location.origin}/posts/${postId}`);
  }, [postId]);

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1500);
    } catch {
      setCopied(false);
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      <button
        type="button"
        onClick={copyLink}
        className="btn"
        style={{ justifyContent: "flex-start" }}
      >
        <span className="mono" style={{ color: "var(--ink-3)", fontSize: 12 }}>
          {copied ? "✓" : "⎘"}
        </span>
        <span>{copied ? "Copied!" : "Copy link"}</span>
      </button>
    </div>
  );
}
