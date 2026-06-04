export function Intro() {
  return (
    <div
      style={{
        padding: "18px 22px",
        border: "1px solid var(--line-2)",
        background: "var(--bg-1)",
        marginBottom: 32,
        display: "flex",
        alignItems: "flex-start",
        gap: 18,
      }}
    >
      <span className="mono" style={{ fontSize: 12, color: "var(--ink-3)", marginTop: 2 }}>
        {">"}_
      </span>
      <div className="mono" style={{ fontSize: 13, lineHeight: 1.7, color: "var(--ink-2)" }}>
        인프라, 백엔드, 그리고 그 사이의 어색한 영역에 대한 글.
        <br />
        아무도 안 시켰지만 쓴다.
      </div>
    </div>
  );
}
