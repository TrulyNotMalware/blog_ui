"use client";

import { useEffect, useState } from "react";

export interface TocItem {
  n: string;
  text: string;
  slug: string;
}

interface Props {
  toc: TocItem[];
}

/**
 * Client TOC list with IntersectionObserver-driven active highlight.
 * The sticky positioning + label header live in the server-rendered <aside>
 * wrapper; this component only handles the interactive list.
 */
export function TocSidebar({ toc }: Props) {
  const [activeSlug, setActiveSlug] = useState<string | null>(null);

  useEffect(() => {
    if (toc.length === 0) return;
    const headings = toc
      .map((t) => document.getElementById(t.slug))
      .filter((el): el is HTMLElement => el !== null);
    if (headings.length === 0) return;

    const visibilityMap = new Map<string, number>();

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            visibilityMap.set(entry.target.id, entry.boundingClientRect.top);
          } else {
            visibilityMap.delete(entry.target.id);
          }
        }
        if (visibilityMap.size === 0) return;
        // Pick the visible heading closest to the top of the viewport.
        const [topSlug] = [...visibilityMap.entries()].sort((a, b) => a[1] - b[1])[0];
        setActiveSlug(topSlug);
      },
      { rootMargin: "-80px 0px -60% 0px", threshold: 0 },
    );

    for (const h of headings) observer.observe(h);
    return () => observer.disconnect();
  }, [toc]);

  return (
    <ul
      style={{
        listStyle: "none",
        padding: 0,
        margin: 0,
        display: "flex",
        flexDirection: "column",
        gap: 4,
      }}
    >
      {toc.map((t) => (
        <li key={t.slug}>
          <a
            href={`#${t.slug}`}
            className="mono toc-link"
            data-active={t.slug === activeSlug || undefined}
            style={{
              display: "flex",
              gap: 10,
              fontSize: 12,
              padding: "6px 8px",
              textDecoration: "none",
            }}
          >
            <span style={{ color: "var(--ink-4)" }}>{t.n}</span>
            <span>{t.text}</span>
          </a>
        </li>
      ))}
    </ul>
  );
}
