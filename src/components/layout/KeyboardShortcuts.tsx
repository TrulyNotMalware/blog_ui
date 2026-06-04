"use client";

import { useEffect } from "react";
import { useUIStore } from "@/stores/useUIStore";

export function KeyboardShortcuts() {
  const openSearch = useUIStore((s) => s.openSearch);
  const closeSearch = useUIStore((s) => s.closeSearch);
  const closeMobileMenu = useUIStore((s) => s.closeMobileMenu);

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      const isMac = navigator.platform.toLowerCase().includes("mac");
      const modKey = isMac ? event.metaKey : event.ctrlKey;
      if (modKey && event.key.toLowerCase() === "k") {
        event.preventDefault();
        openSearch();
      } else if (event.key === "Escape") {
        closeSearch();
        closeMobileMenu();
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [openSearch, closeSearch, closeMobileMenu]);

  return null;
}
