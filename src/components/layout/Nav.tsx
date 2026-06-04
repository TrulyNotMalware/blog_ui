"use client";

import Link from "next/link";
import { useUIStore } from "@/stores/useUIStore";
import { ThemeToggle } from "./ThemeToggle";

export type NavId = "home" | "tags" | "about";

interface NavProps {
  active?: NavId | "admin";
}

const items: { id: NavId; label: string; href: string }[] = [
  { id: "home", label: "index", href: "/" },
  { id: "tags", label: "tags", href: "/tags" },
  { id: "about", label: "about", href: "/about" },
];

export function Nav({ active = "home" }: NavProps) {
  const openSearch = useUIStore((s) => s.openSearch);
  return (
    <header
      style={{
        padding: "24px 48px 20px",
        display: "flex",
        alignItems: "flex-end",
        justifyContent: "space-between",
        borderBottom: "1px dashed var(--line-2)",
      }}
    >
      <div>
        <div
          className="mono"
          style={{
            fontSize: 13,
            color: "var(--ink)",
            display: "flex",
            alignItems: "center",
            gap: 8,
          }}
        >
          <span style={{ color: "var(--ink-3)" }}>~</span>
          <span style={{ color: "var(--ink-4)" }}>$</span>
          <span style={{ fontWeight: 600 }}>cat ./notypiedev</span>
          <span
            style={{
              display: "inline-block",
              width: 8,
              height: 14,
              background: "var(--ink)",
              marginBottom: -2,
            }}
          />
        </div>
        <div className="mono" style={{ fontSize: 11, color: "var(--ink-4)", marginTop: 6 }}>
          // a tech journal · written from a real desk
        </div>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
        <nav className="mono" style={{ display: "flex", gap: 4, fontSize: 12 }}>
          {items.map((it) => {
            const isActive = it.id === active;
            return (
              <Link
                key={it.id}
                href={it.href}
                style={{
                  padding: "4px 10px",
                  color: isActive ? "var(--ink)" : "var(--ink-3)",
                  background: isActive ? "var(--bg-2)" : "transparent",
                  textDecoration: "none",
                  cursor: "pointer",
                  border: "1px solid " + (isActive ? "var(--line-2)" : "transparent"),
                  fontWeight: isActive ? 500 : 400,
                }}
              >
                {it.label}
              </Link>
            );
          })}
        </nav>
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
        <ThemeToggle />
      </div>
    </header>
  );
}
