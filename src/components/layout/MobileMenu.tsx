"use client";

import Link from "next/link";
import { useTheme } from "next-themes";
import { useEffect } from "react";
import { useTagsQuery } from "@/hooks/query/useTagsQuery";
import { useUIStore } from "@/stores/useUIStore";

const NAV_ITEMS = [
  { id: "home", label: "index", cmd: "ls", href: "/" },
  { id: "tags", label: "tags", cmd: "ls ./tags", href: "/tags" },
  { id: "about", label: "about", cmd: "cat about.md", href: "/about" },
];

export function MobileMenu() {
  const isOpen = useUIStore((s) => s.isMobileMenuOpen);
  const closeMobileMenu = useUIStore((s) => s.closeMobileMenu);
  const { theme, setTheme } = useTheme();
  // Mounted on every page via Providers; only query tags when the drawer is open.
  const tagsQuery = useTagsQuery({ enabled: isOpen });

  useEffect(() => {
    if (!isOpen) return;
    const original = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = original;
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const tags = tagsQuery.data ?? [];

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Mobile menu"
      style={{ position: "fixed", inset: 0, zIndex: 40 }}
      onClick={closeMobileMenu}
    >
      <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.5)" }} />
      <aside
        onClick={(e) => e.stopPropagation()}
        style={{
          position: "absolute",
          top: 0,
          right: 0,
          bottom: 0,
          width: "min(280px, 88vw)",
          background: "var(--bg)",
          borderLeft: "1px solid var(--line-2)",
          boxShadow: "-12px 0 30px rgba(0,0,0,0.35)",
          padding: "24px 22px",
          display: "flex",
          flexDirection: "column",
          gap: 28,
          overflowY: "auto",
        }}
      >
        <nav
          className="mono"
          style={{ display: "flex", flexDirection: "column", gap: 4 }}
        >
          <div
            style={{
              fontSize: 10,
              color: "var(--ink-4)",
              letterSpacing: "0.1em",
              marginBottom: 10,
            }}
          >
            // navigate
          </div>
          {NAV_ITEMS.map((it) => (
            <Link
              key={it.id}
              href={it.href}
              onClick={closeMobileMenu}
              style={{
                padding: "10px 12px",
                display: "flex",
                alignItems: "baseline",
                gap: 12,
                borderLeft: "2px solid transparent",
                textDecoration: "none",
                color: "inherit",
                fontSize: 14,
              }}
            >
              <span style={{ color: "var(--ink-2)", fontWeight: 500 }}>{it.label}</span>
              <span style={{ marginLeft: "auto", fontSize: 10, color: "var(--ink-4)" }}>
                $ {it.cmd}
              </span>
            </Link>
          ))}
        </nav>

        <div>
          <div
            className="mono"
            style={{
              fontSize: 10,
              color: "var(--ink-4)",
              letterSpacing: "0.1em",
              marginBottom: 12,
            }}
          >
            // theme
          </div>
          <div
            style={{
              display: "flex",
              gap: 8,
              padding: 4,
              border: "1px solid var(--line-2)",
              background: "var(--bg-1)",
            }}
          >
            {(["dark", "light", "system"] as const).map((t) => {
              const isActive = (theme ?? "system") === t;
              return (
                <button
                  type="button"
                  key={t}
                  onClick={() => setTheme(t)}
                  className="mono"
                  style={{
                    flex: 1,
                    textAlign: "center",
                    padding: "8px 0",
                    fontSize: 12,
                    background: isActive ? "var(--bg-2)" : "transparent",
                    color: isActive ? "var(--ink)" : "var(--ink-3)",
                    cursor: "pointer",
                    border: "none",
                  }}
                >
                  {t === "system" ? "auto" : t}
                </button>
              );
            })}
          </div>
        </div>

        <div>
          <div
            className="mono"
            style={{
              fontSize: 10,
              color: "var(--ink-4)",
              letterSpacing: "0.1em",
              marginBottom: 12,
            }}
          >
            // tags
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
            {tags.slice(0, 8).map((t) => (
              <Link
                key={t.name}
                href={`/tags/${t.name}`}
                onClick={closeMobileMenu}
                className="tag mono"
                style={{ fontSize: 10, textDecoration: "none" }}
              >
                #{t.name} <span style={{ color: "var(--ink-4)" }}>{t.count}</span>
              </Link>
            ))}
            {tagsQuery.isLoading && (
              <span style={{ color: "var(--ink-4)", fontSize: 10 }}>// loading…</span>
            )}
          </div>
        </div>

        <div
          className="mono"
          style={{
            marginTop: "auto",
            fontSize: 10,
            color: "var(--ink-4)",
            display: "flex",
            justifyContent: "space-between",
          }}
        >
          <span>v1.0.4</span>
          <button
            type="button"
            onClick={closeMobileMenu}
            style={{
              background: "transparent",
              border: "none",
              color: "inherit",
              cursor: "pointer",
              fontFamily: "inherit",
              fontSize: "inherit",
              padding: 0,
            }}
          >
            tap × to close
          </button>
        </div>
      </aside>
    </div>
  );
}
