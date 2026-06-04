export function Footer() {
  const year = new Date().getFullYear();
  return (
    <footer
      style={{
        padding: "24px 48px",
        borderTop: "1px dashed var(--line-2)",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        fontFamily: "var(--mono)",
        fontSize: 11,
        color: "var(--ink-4)",
        marginTop: 48,
      }}
    >
      <span>// © {year} notypiedev · built from scratch · no analytics</span>
      <div style={{ display: "flex", gap: 18 }}>
        <a
          style={{ color: "inherit", textDecoration: "none" }}
          href="https://github.com/TrulyNotMalware"
        >
          github
        </a>
        <a
          style={{ color: "inherit", textDecoration: "none" }}
          href="mailto:notleebutyee@gmail.com"
        >
          email
        </a>
        <a style={{ color: "inherit", textDecoration: "none" }} href="/sitemap.xml">
          sitemap
        </a>
      </div>
    </footer>
  );
}
