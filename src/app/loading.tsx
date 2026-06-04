export default function Loading() {
  return (
    <div className="blog-frame">
      <div
        role="status"
        aria-live="polite"
        className="mono"
        style={{ padding: "60px 48px", fontSize: 12, color: "var(--ink-4)" }}
      >
        // loading…
      </div>
    </div>
  );
}
