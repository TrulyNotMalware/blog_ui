"use client";

import { useEffect, useState } from "react";

interface ShareButtonsProps {
  title: string;
  postId: string;
}

export function ShareButtons({ title, postId }: ShareButtonsProps) {
  const [copied, setCopied] = useState(false);
  const [url, setUrl] = useState("");

  useEffect(() => {
    setUrl(`${window.location.origin}/posts/${postId}`);
  }, [postId]);

  const openHN = () => {
    const t = encodeURIComponent(title);
    const u = encodeURIComponent(url);
    window.open(`https://news.ycombinator.com/submitlink?u=${u}&t=${t}`, "_blank", "noopener");
  };

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
        onClick={openHN}
        className="btn"
        style={{ justifyContent: "flex-start" }}
      >
        <span className="mono" style={{ color: "var(--ink-3)", fontSize: 12 }}>
          ↗
        </span>
        <span>Hacker News</span>
      </button>
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
