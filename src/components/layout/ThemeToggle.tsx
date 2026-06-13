"use client";

import { useTheme } from "next-themes";
import { useEffect, useState } from "react";

export function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Use the *resolved* theme so the icon reflects what's actually on screen even when
  // the selected theme is "system". Default to "dark" pre-mount to avoid a hydration flip.
  const current = mounted ? (resolvedTheme ?? "dark") : "dark";
  const isDark = current === "dark";

  const handleToggle = (): void => {
    setTheme(isDark ? "light" : "dark");
  };

  return (
    <button
      type="button"
      className="theme-toggle"
      aria-label={isDark ? "switch to light theme" : "switch to dark theme"}
      aria-pressed={isDark}
      onClick={handleToggle}
    >
      <div className="knob">
        {isDark ? (
          <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor">
            <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
          </svg>
        ) : (
          <svg
            width="10"
            height="10"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={2.5}
          >
            <circle cx="12" cy="12" r="4" />
            <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" />
          </svg>
        )}
      </div>
    </button>
  );
}
