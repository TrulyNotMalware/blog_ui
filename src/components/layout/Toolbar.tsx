"use client";

import { usePathname, useRouter } from "next/navigation";
import { useUIStore } from "@/stores/useUIStore";

interface ToolbarProps {
  view?: "list" | "cards";
  /** Optional pre-fill for the search box / opened modal. */
  tag?: string;
  /** Optional match count to display; omitted when not provided (no fake numbers). */
  matchCount?: number;
}

const VIEW_TABS = [
  { id: "list", label: "list", icon: "≡" },
  { id: "cards", label: "cards", icon: "▦" },
] as const;

export function Toolbar({ view = "list", tag, matchCount }: ToolbarProps) {
  const openSearch = useUIStore((s) => s.openSearch);
  const router = useRouter();
  const pathname = usePathname();

  const handleChangeView = (next: "list" | "cards"): void => {
    if (next === view) return;
    router.push(`${pathname}?view=${next}`, { scroll: false });
  };

  return (
    <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 24 }}>
      <button
        type="button"
        onClick={() => openSearch(tag)}
        className="mono"
        style={{
          display: "flex",
          alignItems: "center",
          gap: 10,
          flex: 1,
          padding: "10px 14px",
          border: "1px solid var(--line-2)",
          background: "var(--bg-1)",
          fontSize: 13,
          textAlign: "left",
          cursor: "pointer",
          color: "inherit",
          fontFamily: "var(--mono)",
        }}
      >
        <span style={{ color: "var(--ink-3)" }}>$</span>
        <span style={{ color: "var(--ink-3)" }}>grep -i &quot;</span>
        <span style={{ color: tag ? "var(--ink)" : "var(--ink-4)" }}>{tag ?? "…"}</span>
        <span style={{ color: "var(--ink-3)" }}>&quot; ./posts/*.md</span>
        {matchCount !== undefined && (
          <span style={{ marginLeft: "auto", color: "var(--ink-4)" }}>{matchCount} matches</span>
        )}
      </button>
      <div
        className="mono"
        role="tablist"
        style={{
          display: "flex",
          fontSize: 12,
          border: "1px solid var(--line-2)",
          background: "var(--bg-1)",
        }}
      >
        {VIEW_TABS.map((v) => {
          const isActive = v.id === view;
          return (
            <button
              type="button"
              key={v.id}
              role="tab"
              aria-selected={isActive}
              onClick={() => handleChangeView(v.id)}
              style={{
                padding: "8px 12px",
                color: isActive ? "var(--ink)" : "var(--ink-3)",
                background: isActive ? "var(--bg-2)" : "transparent",
                borderRight: v.id === "list" ? "1px solid var(--line-2)" : "none",
                borderTop: "none",
                borderBottom: "none",
                borderLeft: "none",
                fontWeight: isActive ? 500 : 400,
                cursor: "pointer",
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
                fontFamily: "var(--mono)",
              }}
            >
              <span style={{ color: isActive ? "var(--ink)" : "var(--ink-4)" }}>{v.icon}</span>
              {v.label}
            </button>
          );
        })}
      </div>
      <button
        type="button"
        aria-label="open search"
        onClick={() => openSearch()}
        className="mono"
        style={{
          display: "flex",
          gap: 6,
          fontSize: 12,
          color: "var(--ink-3)",
          background: "transparent",
          border: "none",
          cursor: "pointer",
          padding: 0,
        }}
      >
        <span className="kbd">⌘</span>
        <span className="kbd">K</span>
      </button>
    </div>
  );
}
