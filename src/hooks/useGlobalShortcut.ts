"use client";

import { useEffect, useRef } from "react";

/**
 * Registers a global keydown listener for a single key, ignoring:
 * - IME composition events (isComposing)
 * - modifier keys (Meta, Ctrl, Alt, Shift)
 * - events fired while focus is on input / textarea / select / [contenteditable]
 */
export function useGlobalShortcut(key: string, handler: () => void): void {
  const handlerRef = useRef(handler);
  handlerRef.current = handler;

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent): void {
      if (e.isComposing) return;
      if (e.metaKey || e.ctrlKey || e.altKey || e.shiftKey) return;
      if (e.key !== key) return;
      if (e.target instanceof Element) {
        const tag = e.target.tagName.toLowerCase();
        if (tag === "input" || tag === "textarea" || tag === "select") return;
        if (e.target.getAttribute("contenteditable") !== null) return;
      }
      handlerRef.current();
    }

    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [key]);
}
