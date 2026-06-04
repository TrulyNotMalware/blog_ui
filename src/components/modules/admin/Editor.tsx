import type { ReactNode } from "react";
import type { Theme } from "@/types";
import { AdminShell } from "./Shell";

interface EditorTab {
  file: string;
  active?: boolean;
  modified?: boolean;
}

interface StatusInfo {
  mode?: string;
  filepath?: string;
  language?: string;
  stats?: string;
  saved?: boolean;
  cursor?: string;
  indent?: string;
  encoding?: string;
}

interface Props {
  theme?: Theme;
  tabs?: EditorTab[];
  status?: StatusInfo;
  source: ReactNode;
  preview: ReactNode;
  actions?: ReactNode;
}

const DEFAULT_STATUS: StatusInfo = {
  mode: "INSERT",
  filepath: "—",
  language: "markdown",
  stats: "",
  saved: true,
  cursor: "",
  indent: "spaces: 2",
  encoding: "UTF-8",
};

export function AdminEditor({
  theme,
  tabs,
  status = DEFAULT_STATUS,
  source,
  preview,
  actions,
}: Props) {
  const effectiveTabs = tabs ?? [];
  return (
    <AdminShell tab="posts" theme={theme}>
      <div
        className="mono"
        style={{
          display: "flex",
          alignItems: "stretch",
          borderBottom: "1px solid var(--line)",
          background: "var(--bg-1)",
        }}
      >
        {effectiveTabs.map((tab) => (
          <span
            key={tab.file}
            style={{
              padding: "10px 16px",
              background: tab.active ? "var(--bg)" : "transparent",
              borderRight: "1px solid var(--line)",
              fontSize: 12,
              color: tab.active ? "var(--ink)" : "var(--ink-4)",
              display: "inline-flex",
              alignItems: "center",
              gap: 10,
              borderTop: tab.active ? "2px solid var(--ink)" : "2px solid transparent",
              marginTop: -1,
            }}
          >
            {tab.active && <span style={{ color: "var(--ink-3)" }}>📝</span>}
            {tab.file}
            {tab.modified && <span style={{ color: "var(--ink-3)" }}>•</span>}
          </span>
        ))}
        <span
          style={{
            marginLeft: "auto",
            display: "flex",
            alignItems: "center",
            gap: 8,
            paddingRight: 16,
          }}
        >
          {actions}
        </span>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", minHeight: 600 }}>
        <div
          style={{
            borderRight: "1px solid var(--line)",
            background: "var(--code-bg)",
            fontFamily: "var(--mono)",
          }}
        >
          <div
            className="mono"
            style={{
              padding: "8px 14px",
              fontSize: 10,
              color: "var(--ink-4)",
              borderBottom: "1px dashed var(--line-2)",
              letterSpacing: "0.08em",
              textTransform: "uppercase",
              display: "flex",
              alignItems: "center",
              gap: 10,
            }}
          >
            <span>// source</span>
            <span style={{ flex: 1 }} />
            <span>markdown</span>
            <span>·</span>
            <span>utf-8</span>
            <span>·</span>
            <span>LF</span>
          </div>
          <div style={{ flex: 1 }}>{source}</div>
        </div>

        <div style={{ background: "var(--bg)", display: "flex", flexDirection: "column" }}>
          <div
            className="mono"
            style={{
              padding: "8px 14px",
              fontSize: 10,
              color: "var(--ink-4)",
              borderBottom: "1px dashed var(--line-2)",
              letterSpacing: "0.08em",
              textTransform: "uppercase",
              display: "flex",
              alignItems: "center",
              gap: 10,
            }}
          >
            <span>// preview</span>
            <span style={{ flex: 1 }} />
            <span>live</span>
          </div>
          <div style={{ padding: "24px 36px", flex: 1, overflow: "auto" }}>{preview}</div>
        </div>
      </div>

      <div
        className="mono"
        style={{
          display: "flex",
          alignItems: "stretch",
          borderTop: "1px solid var(--line)",
          fontSize: 11,
          height: 28,
        }}
      >
        <span
          style={{
            background: "var(--ink)",
            color: "var(--bg)",
            padding: "0 14px",
            display: "inline-flex",
            alignItems: "center",
            letterSpacing: "0.08em",
            fontWeight: 600,
          }}
        >
          {status.mode}
        </span>
        <span
          style={{
            padding: "0 14px",
            display: "inline-flex",
            alignItems: "center",
            color: "var(--ink-2)",
            background: "var(--bg-2)",
            borderRight: "1px solid var(--line)",
          }}
        >
          {status.filepath}
        </span>
        <span
          style={{
            padding: "0 14px",
            display: "inline-flex",
            alignItems: "center",
            color: "var(--ink-3)",
            borderRight: "1px solid var(--line)",
          }}
        >
          {status.language}
        </span>
        <span
          style={{
            padding: "0 14px",
            display: "inline-flex",
            alignItems: "center",
            color: "var(--ink-3)",
          }}
        >
          {status.stats}
        </span>
        <span
          style={{
            marginLeft: "auto",
            display: "inline-flex",
            alignItems: "center",
            gap: 14,
            paddingRight: 16,
            color: "var(--ink-4)",
          }}
        >
          {status.saved !== undefined && (
            <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
              <span
                style={{
                  width: 6,
                  height: 6,
                  background: status.saved ? "#5eb874" : "#e8a44a",
                  borderRadius: 999,
                }}
              />
              {status.saved ? "saved" : "modified"}
            </span>
          )}
          {status.cursor && (
            <>
              <span>·</span>
              <span>{status.cursor}</span>
            </>
          )}
          <span>·</span>
          <span>{status.indent}</span>
          <span>·</span>
          <span>{status.encoding}</span>
        </span>
      </div>
    </AdminShell>
  );
}
