"use client";

import { useState, type CSSProperties } from "react";
import { ApiError } from "@/api/client";
import { adminEndpoints } from "@/api/endpoints";
import type { AboutContent, IntroContent } from "@/services/contentService";

// ── shared fetch helper ────────────────────────────────────────────────────

async function putContent(key: string, content: unknown): Promise<void> {
  const res = await fetch(adminEndpoints.content.detail(key), {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    credentials: "same-origin",
    body: JSON.stringify({ content }),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new ApiError(res.statusText, res.status, body);
  }
}

// ── shared sub-components ─────────────────────────────────────────────────

function SaveBar({
  saving,
  status,
  onSave,
}: {
  saving: boolean;
  status: { ok: boolean; msg: string } | null;
  onSave: () => void;
}) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 12, marginTop: 16 }}>
      <button
        onClick={onSave}
        disabled={saving}
        className="mono"
        style={{
          height: 30,
          padding: "0 16px",
          background: "var(--ink)",
          color: "var(--bg)",
          border: "1px solid var(--ink)",
          fontSize: 12,
          cursor: saving ? "not-allowed" : "pointer",
          opacity: saving ? 0.6 : 1,
        }}
      >
        {saving ? "saving…" : "save"}
      </button>
      {status && (
        <span
          className="mono"
          style={{ fontSize: 11, color: status.ok ? "#5eb874" : "var(--error, #c0392b)" }}
        >
          {status.msg}
        </span>
      )}
    </div>
  );
}

function labelStyle(): CSSProperties {
  return { fontSize: 11, color: "var(--ink-4)", fontFamily: "var(--mono)", letterSpacing: "0.08em", marginBottom: 4, display: "block" };
}

function inputStyle(): CSSProperties {
  return {
    width: "100%",
    padding: "6px 10px",
    background: "var(--bg-1)",
    border: "1px solid var(--line)",
    color: "var(--ink)",
    fontFamily: "var(--mono)",
    fontSize: 13,
    boxSizing: "border-box",
  };
}

function textareaStyle(rows = 4): CSSProperties {
  return { ...inputStyle(), resize: "vertical", minHeight: rows * 24 };
}

// ── Intro editor ──────────────────────────────────────────────────────────

interface IntroEditorProps {
  initial: IntroContent;
}

export function IntroEditor({ initial }: IntroEditorProps) {
  const [lines, setLines] = useState<string[]>(initial.lines);
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState<{ ok: boolean; msg: string } | null>(null);

  const text = lines.join("\n");

  async function handleSave() {
    setSaving(true);
    setStatus(null);
    try {
      await putContent("intro", { lines: text.split("\n").filter((l) => l.trim() !== "") });
      setStatus({ ok: true, msg: "// saved" });
    } catch (err) {
      const msg = err instanceof ApiError ? `error ${err.status}` : "save failed";
      setStatus({ ok: false, msg });
    } finally {
      setSaving(false);
    }
  }

  return (
    <section style={{ marginBottom: 40 }}>
      <div className="mono" style={{ fontSize: 11, color: "var(--ink-4)", letterSpacing: "0.1em", marginBottom: 14 }}>
        {"// intro"}
      </div>
      <label style={labelStyle()}>lines (one per row)</label>
      <textarea
        value={text}
        onChange={(e) => setLines(e.target.value.split("\n"))}
        rows={4}
        style={textareaStyle(4)}
      />
      <SaveBar saving={saving} status={status} onSave={handleSave} />
    </section>
  );
}

// ── About editor ─────────────────────────────────────────────────────────

interface AboutEditorProps {
  initial: AboutContent;
}

type NowItem = { type: string; text: string };
type KvItem = { key: string; value: string };
type ContactItem = { label: string; value: string };

export function AboutEditor({ initial }: AboutEditorProps) {
  const [headline, setHeadline] = useState(initial.headline);
  const [paragraphsText, setParagraphsText] = useState(initial.paragraphs.join("\n\n"));
  const [now, setNow] = useState<NowItem[]>(initial.now);
  const [stack, setStack] = useState<KvItem[]>(initial.stack);
  const [contact, setContact] = useState<ContactItem[]>(initial.contact);
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState<{ ok: boolean; msg: string } | null>(null);

  async function handleSave() {
    setSaving(true);
    setStatus(null);
    const paragraphs = paragraphsText.split(/\n\n+/).map((p) => p.trim()).filter(Boolean);
    try {
      await putContent("about", { headline, paragraphs, now, stack, contact });
      setStatus({ ok: true, msg: "// saved" });
    } catch (err) {
      const msg = err instanceof ApiError ? `error ${err.status}` : "save failed";
      setStatus({ ok: false, msg });
    } finally {
      setSaving(false);
    }
  }

  return (
    <section>
      <div className="mono" style={{ fontSize: 11, color: "var(--ink-4)", letterSpacing: "0.1em", marginBottom: 14 }}>
        {"// about"}
      </div>

      {/* headline */}
      <div style={{ marginBottom: 16 }}>
        <label style={labelStyle()}>headline</label>
        <input
          value={headline}
          onChange={(e) => setHeadline(e.target.value)}
          style={inputStyle()}
        />
      </div>

      {/* paragraphs */}
      <div style={{ marginBottom: 24 }}>
        <label style={labelStyle()}>paragraphs (blank line = new paragraph; backticks = inline code)</label>
        <textarea
          value={paragraphsText}
          onChange={(e) => setParagraphsText(e.target.value)}
          rows={6}
          style={textareaStyle(6)}
        />
      </div>

      {/* now */}
      <NowList items={now} onChange={setNow} />

      {/* stack */}
      <KvList label="stack" items={stack} keyPlaceholder="key" valPlaceholder="value" onChange={setStack} />

      {/* contact */}
      <ContactList items={contact} onChange={setContact} />

      <SaveBar saving={saving} status={status} onSave={handleSave} />
    </section>
  );
}

// ── NowList ───────────────────────────────────────────────────────────────

function NowList({ items, onChange }: { items: NowItem[]; onChange: (v: NowItem[]) => void }) {
  return (
    <div style={{ marginBottom: 24 }}>
      <div className="mono" style={{ fontSize: 11, color: "var(--ink-4)", marginBottom: 8 }}>{"// now"}</div>
      {items.map((it, i) => (
        <div key={i} style={{ display: "grid", gridTemplateColumns: "120px 1fr 28px", gap: 8, marginBottom: 6 }}>
          <input
            value={it.type}
            placeholder="type"
            onChange={(e) => {
              const next = [...items];
              next[i] = { ...it, type: e.target.value };
              onChange(next);
            }}
            style={inputStyle()}
          />
          <input
            value={it.text}
            placeholder="text"
            onChange={(e) => {
              const next = [...items];
              next[i] = { ...it, text: e.target.value };
              onChange(next);
            }}
            style={inputStyle()}
          />
          <button
            onClick={() => onChange(items.filter((_, j) => j !== i))}
            className="mono"
            style={{ fontSize: 14, background: "transparent", border: "1px solid var(--line)", color: "var(--ink-3)", cursor: "pointer" }}
          >
            ×
          </button>
        </div>
      ))}
      <button
        onClick={() => onChange([...items, { type: "", text: "" }])}
        className="mono"
        style={{ fontSize: 11, color: "var(--ink-3)", background: "transparent", border: "1px dashed var(--line)", padding: "4px 10px", cursor: "pointer" }}
      >
        + add row
      </button>
    </div>
  );
}

// ── KvList ────────────────────────────────────────────────────────────────

function KvList({
  label,
  items,
  keyPlaceholder,
  valPlaceholder,
  onChange,
}: {
  label: string;
  items: KvItem[];
  keyPlaceholder: string;
  valPlaceholder: string;
  onChange: (v: KvItem[]) => void;
}) {
  return (
    <div style={{ marginBottom: 24 }}>
      <div className="mono" style={{ fontSize: 11, color: "var(--ink-4)", marginBottom: 8 }}>{`// ${label}`}</div>
      {items.map((it, i) => (
        <div key={i} style={{ display: "grid", gridTemplateColumns: "140px 1fr 28px", gap: 8, marginBottom: 6 }}>
          <input
            value={it.key}
            placeholder={keyPlaceholder}
            onChange={(e) => {
              const next = [...items];
              next[i] = { ...it, key: e.target.value };
              onChange(next);
            }}
            style={inputStyle()}
          />
          <input
            value={it.value}
            placeholder={valPlaceholder}
            onChange={(e) => {
              const next = [...items];
              next[i] = { ...it, value: e.target.value };
              onChange(next);
            }}
            style={inputStyle()}
          />
          <button
            onClick={() => onChange(items.filter((_, j) => j !== i))}
            className="mono"
            style={{ fontSize: 14, background: "transparent", border: "1px solid var(--line)", color: "var(--ink-3)", cursor: "pointer" }}
          >
            ×
          </button>
        </div>
      ))}
      <button
        onClick={() => onChange([...items, { key: "", value: "" }])}
        className="mono"
        style={{ fontSize: 11, color: "var(--ink-3)", background: "transparent", border: "1px dashed var(--line)", padding: "4px 10px", cursor: "pointer" }}
      >
        + add row
      </button>
    </div>
  );
}

// ── ContactList ───────────────────────────────────────────────────────────

function ContactList({ items, onChange }: { items: ContactItem[]; onChange: (v: ContactItem[]) => void }) {
  return (
    <div style={{ marginBottom: 24 }}>
      <div className="mono" style={{ fontSize: 11, color: "var(--ink-4)", marginBottom: 8 }}>{"// contact"}</div>
      {items.map((it, i) => (
        <div key={i} style={{ display: "grid", gridTemplateColumns: "120px 1fr 28px", gap: 8, marginBottom: 6 }}>
          <input
            value={it.label}
            placeholder="label"
            onChange={(e) => {
              const next = [...items];
              next[i] = { ...it, label: e.target.value };
              onChange(next);
            }}
            style={inputStyle()}
          />
          <input
            value={it.value}
            placeholder="value"
            onChange={(e) => {
              const next = [...items];
              next[i] = { ...it, value: e.target.value };
              onChange(next);
            }}
            style={inputStyle()}
          />
          <button
            onClick={() => onChange(items.filter((_, j) => j !== i))}
            className="mono"
            style={{ fontSize: 14, background: "transparent", border: "1px solid var(--line)", color: "var(--ink-3)", cursor: "pointer" }}
          >
            ×
          </button>
        </div>
      ))}
      <button
        onClick={() => onChange([...items, { label: "", value: "" }])}
        className="mono"
        style={{ fontSize: 11, color: "var(--ink-3)", background: "transparent", border: "1px dashed var(--line)", padding: "4px 10px", cursor: "pointer" }}
      >
        + add row
      </button>
    </div>
  );
}
