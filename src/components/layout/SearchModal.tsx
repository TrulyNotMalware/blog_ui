"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { useTagsQuery } from "@/hooks/query/useTagsQuery";
import { postService } from "@/services/postService";
import { useUIStore } from "@/stores/useUIStore";
import type { Post } from "@/types";
import { postDate } from "@/utils/date";

const SEARCH_DEBOUNCE_MS = 300;
const SEARCH_PAGE_SIZE = 8;

export function SearchModal() {
  const isOpen = useUIStore((s) => s.isSearchOpen);
  const query = useUIStore((s) => s.searchQuery);
  const setSearchQuery = useUIStore((s) => s.setSearchQuery);
  const closeSearch = useUIStore((s) => s.closeSearch);

  const inputRef = useRef<HTMLInputElement>(null);
  const modalRef = useRef<HTMLDivElement>(null);

  const [results, setResults] = useState<Post[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [hasError, setHasError] = useState(false);

  // Only fetch tags once the modal is actually open — this component is mounted on every
  // page (via Providers), so an unconditional query would fire app-wide on every load.
  const tagsQuery = useTagsQuery({ enabled: isOpen });

  useEffect(() => {
    if (isOpen) inputRef.current?.focus();
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const original = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = original;
    };
  }, [isOpen]);

  // Own Escape listener: a dialog should close itself rather than depend on a sibling
  // (<KeyboardShortcuts>) being mounted. Both call closeSearch(), which is idempotent.
  useEffect(() => {
    if (!isOpen) return;
    function onKey(e: KeyboardEvent): void {
      if (e.key === "Escape") closeSearch();
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [isOpen, closeSearch]);

  useEffect(() => {
    if (!isOpen) return;
    function onFocusIn(e: FocusEvent): void {
      const modal = modalRef.current;
      if (modal && e.target instanceof Node && !modal.contains(e.target)) {
        inputRef.current?.focus();
      }
    }
    document.addEventListener("focusin", onFocusIn);
    return () => document.removeEventListener("focusin", onFocusIn);
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) {
      setResults([]);
      setHasError(false);
      setIsSearching(false);
      return;
    }
    const trimmed = query.trim();
    if (!trimmed) {
      setResults([]);
      setHasError(false);
      setIsSearching(false);
      return;
    }
    const ctrl = new AbortController();
    const timer = setTimeout(() => {
      setIsSearching(true);
      setHasError(false);
      postService
        .search({ q: trimmed, pageSize: SEARCH_PAGE_SIZE }, ctrl.signal)
        .then((res) => {
          setResults(res.items);
          setIsSearching(false);
        })
        .catch((e: unknown) => {
          if (e instanceof DOMException && e.name === "AbortError") return;
          setHasError(true);
          setIsSearching(false);
        });
    }, SEARCH_DEBOUNCE_MS);
    return () => {
      clearTimeout(timer);
      ctrl.abort();
    };
  }, [isOpen, query]);

  const onChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => setSearchQuery(e.target.value),
    [setSearchQuery],
  );

  if (!isOpen) return null;

  const trimmed = query.trim();
  const allTags = tagsQuery.data ?? [];
  const tags = trimmed
    ? allTags.filter((t) => t.name.toLowerCase().includes(trimmed.toLowerCase()))
    : allTags.slice(0, 6);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Search"
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 50,
        display: "flex",
        alignItems: "flex-start",
        justifyContent: "center",
        background: "rgba(0,0,0,0.5)",
        padding: "min(120px, 12vh) 16px 16px",
      }}
      onClick={closeSearch}
    >
      <div
        ref={modalRef}
        onClick={(e) => e.stopPropagation()}
        style={{
          width: "min(660px, 100%)",
          maxHeight: "80vh",
          overflow: "auto",
          background: "var(--bg)",
          border: "1px solid var(--line-2)",
          borderRadius: 4,
          boxShadow: "var(--shadow)",
          fontFamily: "var(--mono)",
        }}
      >
        <div
          style={{
            padding: "14px 18px",
            display: "flex",
            alignItems: "center",
            gap: 12,
            borderBottom: "1px dashed var(--line-2)",
          }}
        >
          <span style={{ color: "var(--ink-3)", fontSize: 13 }}>$</span>
          <span style={{ color: "var(--ink-4)", fontSize: 13 }}>grep -ri &quot;</span>
          <input
            ref={inputRef}
            value={query}
            onChange={onChange}
            placeholder="검색어 입력…"
            aria-label="search input"
            style={{
              flex: 1,
              minWidth: 0,
              background: "transparent",
              border: "none",
              outline: "none",
              padding: 0,
              fontFamily: "var(--mono)",
              fontSize: 14,
              color: "var(--ink)",
            }}
          />
          <span style={{ color: "var(--ink-4)", fontSize: 13 }}>&quot;</span>
          <span style={{ color: "var(--ink-4)", fontSize: 11 }}>
            {results.length} posts · {tags.length} tags
          </span>
          <button
            type="button"
            onClick={closeSearch}
            className="kbd"
            aria-label="close"
            style={{ cursor: "pointer" }}
          >
            esc
          </button>
        </div>

        {isSearching && (
          <div style={{ padding: "14px 18px", color: "var(--ink-4)", fontSize: 12 }}>
            // searching…
          </div>
        )}
        {hasError && (
          <div style={{ padding: "14px 18px", color: "var(--ink-4)", fontSize: 12 }}>
            ! 검색에 실패했습니다.
          </div>
        )}

        {!isSearching && !hasError && (
          <>
            <div
              style={{
                padding: "10px 18px 4px",
                fontSize: 10,
                color: "var(--ink-4)",
                letterSpacing: "0.12em",
              }}
            >
              // POSTS
            </div>
            {trimmed && results.length === 0 && (
              <div
                style={{ padding: "10px 18px 14px", color: "var(--ink-4)", fontSize: 12 }}
              >
                // no matches
              </div>
            )}
            {!trimmed && (
              <div
                style={{ padding: "10px 18px 14px", color: "var(--ink-4)", fontSize: 12 }}
              >
                // type to search posts
              </div>
            )}
            {results.map((p) => (
              <Link
                key={p.id}
                href={`/posts/${p.id}`}
                onClick={closeSearch}
                style={{
                  display: "grid",
                  gridTemplateColumns: "90px 1fr",
                  gap: 14,
                  padding: "10px 18px",
                  alignItems: "baseline",
                  textDecoration: "none",
                  color: "inherit",
                }}
              >
                <span style={{ fontSize: 11, color: "var(--ink-4)" }}>{postDate(p.date)}</span>
                <div>
                  <div
                    style={{
                      fontFamily: "var(--sans)",
                      fontSize: 13,
                      color: "var(--ink)",
                      marginBottom: 2,
                    }}
                  >
                    {p.title}
                  </div>
                  <div
                    style={{
                      fontSize: 11,
                      color: "var(--ink-4)",
                      display: "flex",
                      gap: 10,
                    }}
                  >
                    {p.tags.map((t) => (
                      <span key={t}>#{t}</span>
                    ))}
                  </div>
                </div>
              </Link>
            ))}

            <div
              style={{
                padding: "10px 18px 4px",
                fontSize: 10,
                color: "var(--ink-4)",
                letterSpacing: "0.12em",
                borderTop: "1px solid var(--line)",
              }}
            >
              // TAGS
            </div>
            <div
              style={{
                padding: "4px 18px 12px",
                display: "flex",
                gap: 8,
                flexWrap: "wrap",
              }}
            >
              {tags.length === 0 && (
                <span style={{ color: "var(--ink-4)", fontSize: 11 }}>// no matches</span>
              )}
              {tags.map((t) => (
                <Link
                  key={t.name}
                  href={`/tags/${t.name}`}
                  onClick={closeSearch}
                  className="tag mono"
                  style={{ textDecoration: "none" }}
                >
                  #{t.name} <span style={{ color: "var(--ink-4)" }}>{t.count}</span>
                </Link>
              ))}
            </div>
          </>
        )}

        <div
          style={{
            padding: "10px 18px",
            borderTop: "1px solid var(--line)",
            display: "flex",
            alignItems: "center",
            gap: 18,
            fontSize: 11,
            color: "var(--ink-4)",
            flexWrap: "wrap",
          }}
        >
          <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <span className="kbd">↵</span> open
          </span>
          <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <span className="kbd">esc</span> close
          </span>
          <span style={{ marginLeft: "auto" }}>powered by /v1/search</span>
        </div>
      </div>
    </div>
  );
}
