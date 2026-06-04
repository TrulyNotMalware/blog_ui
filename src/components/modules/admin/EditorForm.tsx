"use client";

import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import { useMemo, useState, type ReactNode } from "react";
import { ApiError } from "@/api/client";
import { AdminEditor } from "@/components/modules/admin/Editor";
import { StatusBadge } from "@/components/modules/admin/Shell";
import { postService, type PostMutationPayload } from "@/services/postService";
import type { PostAdmin, PostKind } from "@/types";

const MarkdownContent = dynamic(
  () => import("@/components/modules/blog/MarkdownContent").then((m) => m.MarkdownContent),
  {
    ssr: false,
    loading: () => (
      <div className="mono" style={{ fontSize: 11, color: "var(--ink-4)" }}>
        // loading preview…
      </div>
    ),
  },
);

const KINDS: PostKind[] = ["essay", "note", "guide", "compare"];

interface FormState {
  id: string;
  title: string;
  excerpt: string;
  tagsText: string;
  date: string;
  kind: PostKind;
  content: string;
}

function todayIso(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function parseTags(text: string): string[] {
  const tokens = text
    .split(",")
    .map((t) => t.trim().toLowerCase())
    .filter(Boolean);
  return [...new Set(tokens)];
}

function computeReadTime(content: string): string {
  // ~250 chars per minute for Korean technical content (rough).
  const minutes = Math.max(1, Math.round(content.length / 250));
  return `${minutes}분`;
}

function buildPayload(state: FormState, originalId?: string): PostMutationPayload {
  const out: PostMutationPayload = {
    title: state.title,
    excerpt: state.excerpt,
    tags: parseTags(state.tagsText),
    date: state.date,
    kind: state.kind,
    content: state.content,
    readTime: computeReadTime(state.content),
  };
  // Only include `id` in body when editing AND slug actually changed (rename).
  if (originalId !== undefined && state.id && state.id !== originalId) {
    out.id = state.id;
  }
  return out;
}

interface Props {
  mode: "new" | "edit";
  initial?: PostAdmin;
}

export function EditorForm({ mode, initial }: Props) {
  const router = useRouter();
  const [state, setState] = useState<FormState>(() =>
    initial
      ? {
          id: initial.id,
          title: initial.title,
          excerpt: initial.excerpt,
          tagsText: initial.tags.join(", "),
          date: initial.date,
          kind: initial.kind,
          content: initial.content ?? "",
        }
      : {
          id: "",
          title: "",
          excerpt: "",
          tagsText: "",
          date: todayIso(),
          kind: "essay",
          content: "",
        },
  );
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<PostAdmin["status"]>(initial?.status ?? "draft");

  function setField<K extends keyof FormState>(key: K, value: FormState[K]) {
    setState((s) => ({ ...s, [key]: value }));
    setError(null);
  }

  function handleError(e: unknown, fallback: string) {
    if (e instanceof ApiError) {
      const body = e.body as { detail?: string; error?: string; message?: string } | undefined;
      const msg = body?.detail ?? body?.error ?? body?.message ?? `${fallback} (${e.status})`;
      setError(typeof msg === "string" ? msg : fallback);
    } else if (e instanceof Error) {
      setError(e.message);
    } else {
      setError(fallback);
    }
  }

  async function saveDraft() {
    if (!state.id.trim() || !state.title.trim()) {
      setError("id 와 title 은 필수입니다");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const payload = { ...buildPayload(state), id: state.id, status: "draft" as const };
      const created = await postService.create(payload);
      router.push(`/admin/edit/${encodeURIComponent(created.id)}`);
      router.refresh();
    } catch (e) {
      handleError(e, "draft 저장 실패");
    } finally {
      setBusy(false);
    }
  }

  async function publishNew() {
    if (!state.id.trim() || !state.title.trim()) {
      setError("id 와 title 은 필수입니다");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const payload = { ...buildPayload(state), id: state.id, status: "published" as const };
      const created = await postService.create(payload);
      router.push(`/admin/edit/${encodeURIComponent(created.id)}`);
      router.refresh();
    } catch (e) {
      handleError(e, "publish 실패");
    } finally {
      setBusy(false);
    }
  }

  async function update() {
    if (!initial) return;
    setBusy(true);
    setError(null);
    try {
      const payload = buildPayload(state, initial.id);
      const result = await postService.update(initial.id, payload);
      setStatus(result.status);
      if (result.id !== initial.id) {
        router.push(`/admin/edit/${encodeURIComponent(result.id)}`);
      }
      router.refresh();
    } catch (e) {
      handleError(e, "업데이트 실패");
    } finally {
      setBusy(false);
    }
  }

  async function publishExisting() {
    if (!initial) return;
    setBusy(true);
    setError(null);
    try {
      const result = await postService.publish(initial.id);
      setStatus(result.status);
      router.refresh();
    } catch (e) {
      handleError(e, "publish 실패");
    } finally {
      setBusy(false);
    }
  }

  async function revertToDraft() {
    if (!initial) return;
    setBusy(true);
    setError(null);
    try {
      const result = await postService.update(initial.id, { status: "draft" });
      setStatus(result.status);
      router.refresh();
    } catch (e) {
      handleError(e, "draft 전환 실패");
    } finally {
      setBusy(false);
    }
  }

  async function removeIt() {
    if (!initial) return;
    if (!window.confirm(`Delete "${initial.title}"? This cannot be undone.`)) return;
    setBusy(true);
    setError(null);
    try {
      await postService.remove(initial.id);
      router.push("/admin");
      router.refresh();
    } catch (e) {
      handleError(e, "삭제 실패");
    } finally {
      setBusy(false);
    }
  }

  const tabs = useMemo(
    () => [
      {
        file: state.id ? `${state.date}-${state.id}.md` : "new-post.md",
        active: true,
        modified: mode === "edit" ? false : true,
      },
    ],
    [state.id, state.date, mode],
  );

  const stats = useMemo(() => {
    const chars = state.content.length;
    const words = state.content.trim().split(/\s+/).filter(Boolean).length;
    return `${chars.toLocaleString()} chars · ${words.toLocaleString()} words`;
  }, [state.content]);

  const sourcePane: ReactNode = (
    <div style={{ display: "flex", flexDirection: "column", gap: 12, padding: "14px 16px" }}>
      <FieldRow label="id (slug)">
        <input
          type="text"
          value={state.id}
          onChange={(e) => setField("id", e.target.value)}
          placeholder="my-post"
          style={inputStyle}
        />
        <Help>URL slug — ASCII 권장 (e.g. my-post). 한글도 허용.</Help>
      </FieldRow>
      <FieldRow label="title">
        <input
          type="text"
          value={state.title}
          onChange={(e) => setField("title", e.target.value)}
          style={inputStyle}
        />
      </FieldRow>
      <FieldRow label="excerpt">
        <textarea
          value={state.excerpt}
          onChange={(e) => setField("excerpt", e.target.value)}
          rows={2}
          style={{ ...inputStyle, height: "auto", resize: "vertical", padding: "8px 10px" }}
        />
      </FieldRow>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10 }}>
        <FieldRow label="date">
          <input
            type="date"
            value={state.date}
            onChange={(e) => setField("date", e.target.value)}
            style={inputStyle}
          />
        </FieldRow>
        <FieldRow label="kind">
          <select
            value={state.kind}
            onChange={(e) => setField("kind", e.target.value as PostKind)}
            style={inputStyle}
          >
            {KINDS.map((k) => (
              <option key={k} value={k}>
                {k}
              </option>
            ))}
          </select>
        </FieldRow>
        <FieldRow label="tags">
          <input
            type="text"
            value={state.tagsText}
            onChange={(e) => setField("tagsText", e.target.value)}
            placeholder="infra, astro"
            style={inputStyle}
          />
        </FieldRow>
      </div>
      <FieldRow label="content">
        <textarea
          value={state.content}
          onChange={(e) => setField("content", e.target.value)}
          rows={26}
          spellCheck={false}
          style={{
            ...inputStyle,
            height: "auto",
            padding: "10px 12px",
            fontFamily: "var(--mono)",
            fontSize: 13,
            lineHeight: 1.7,
            resize: "vertical",
            whiteSpace: "pre",
          }}
        />
      </FieldRow>
      {error && (
        <div
          className="mono"
          role="alert"
          style={{
            fontSize: 12,
            color: "#e36464",
            padding: "8px 10px",
            border: "1px solid #e36464",
            background: "rgba(227,100,100,0.08)",
          }}
        >
          {error}
        </div>
      )}
    </div>
  );

  const actions: ReactNode = (
    <>
      {mode === "edit" && initial && (
        <span style={{ marginRight: 8 }}>
          <StatusBadge status={status} />
        </span>
      )}
      {mode === "new" ? (
        <>
          <button
            type="button"
            onClick={saveDraft}
            disabled={busy}
            className="btn"
            style={btnGhost}
          >
            save draft
          </button>
          <button
            type="button"
            onClick={publishNew}
            disabled={busy}
            style={btnPrimary}
          >
            publish
          </button>
        </>
      ) : (
        <>
          <button
            type="button"
            onClick={removeIt}
            disabled={busy}
            style={btnDanger}
          >
            delete
          </button>
          {status === "published" && (
            <button
              type="button"
              onClick={revertToDraft}
              disabled={busy}
              style={btnGhost}
            >
              save as draft
            </button>
          )}
          {status === "draft" && (
            <button
              type="button"
              onClick={publishExisting}
              disabled={busy}
              style={btnGhost}
            >
              publish
            </button>
          )}
          <button
            type="button"
            onClick={update}
            disabled={busy}
            style={btnPrimary}
          >
            update
          </button>
        </>
      )}
    </>
  );

  const previewPane = (
    <div>
      <h1 style={{ fontSize: 26, margin: "0 0 6px", letterSpacing: "-0.02em" }}>
        {state.title || <span style={{ color: "var(--ink-4)" }}>(title)</span>}
      </h1>
      <div
        className="mono"
        style={{ fontSize: 11, color: "var(--ink-4)", marginBottom: 18 }}
      >
        {state.date} · {state.kind} · {parseTags(state.tagsText).map((t) => `#${t}`).join(" ")}
      </div>
      <MarkdownContent source={state.content} />
      {mode === "edit" && initial && (
        <div
          className="mono"
          style={{
            marginTop: 28,
            paddingTop: 14,
            borderTop: "1px dashed var(--line-2)",
            fontSize: 10,
            color: "var(--ink-4)",
            display: "flex",
            gap: 14,
          }}
        >
          <span>created {initial.createdAt}</span>
          <span>·</span>
          <span>updated {initial.updatedAt}</span>
        </div>
      )}
    </div>
  );

  return (
    <AdminEditor
      tabs={tabs}
      source={sourcePane}
      preview={previewPane}
      actions={actions}
      status={{
        mode: busy ? "BUSY" : mode === "new" ? "NEW" : "EDIT",
        filepath: state.id ? `posts/${state.id}.md` : "posts/<new>.md",
        language: "markdown",
        stats,
        saved: mode === "edit" && !busy,
        indent: "spaces: 2",
        encoding: "UTF-8",
      }}
    />
  );
}

function FieldRow({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label
      className="mono"
      style={{
        fontSize: 10,
        color: "var(--ink-4)",
        letterSpacing: "0.08em",
        textTransform: "uppercase",
        display: "flex",
        flexDirection: "column",
        gap: 6,
      }}
    >
      // {label}
      {children}
    </label>
  );
}

function Help({ children }: { children: ReactNode }) {
  return (
    <span
      className="mono"
      style={{
        fontSize: 10,
        color: "var(--ink-4)",
        textTransform: "none",
        letterSpacing: 0,
      }}
    >
      {children}
    </span>
  );
}

const inputStyle: React.CSSProperties = {
  height: 32,
  padding: "0 10px",
  background: "var(--bg)",
  color: "var(--ink)",
  border: "1px solid var(--line-2)",
  fontFamily: "var(--mono)",
  fontSize: 13,
  outline: "none",
};

const btnGhost: React.CSSProperties = {
  height: 28,
  padding: "0 12px",
  background: "var(--bg-1)",
  color: "var(--ink-2)",
  border: "1px solid var(--line-2)",
  fontFamily: "var(--mono)",
  fontSize: 12,
  cursor: "pointer",
};

const btnPrimary: React.CSSProperties = {
  height: 28,
  padding: "0 14px",
  background: "var(--ink)",
  color: "var(--bg)",
  border: "1px solid var(--ink)",
  fontFamily: "var(--mono)",
  fontSize: 12,
  cursor: "pointer",
};

const btnDanger: React.CSSProperties = {
  height: 28,
  padding: "0 12px",
  background: "transparent",
  color: "#e36464",
  border: "1px solid #e36464",
  fontFamily: "var(--mono)",
  fontSize: 12,
  cursor: "pointer",
};
