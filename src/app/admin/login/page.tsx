"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";

export default function AdminLoginPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    const form = new FormData(e.currentTarget);
    const username = String(form.get("username") ?? "").trim();
    const password = String(form.get("password") ?? "");
    try {
      const res = await fetch("/api/admin/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });
      if (res.ok) {
        router.push("/admin");
        router.refresh();
        return;
      }
      if (res.status === 401) {
        setError("잘못된 자격증명입니다");
      } else {
        setError(`로그인 실패 (${res.status})`);
      }
    } catch {
      setError("네트워크 오류");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div
      className="blog-frame"
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 20,
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: 380,
          border: "1px solid var(--line-2)",
          background: "var(--bg-1)",
          padding: "28px 28px 24px",
        }}
      >
        <div
          className="mono"
          style={{
            fontSize: 12,
            color: "var(--ink)",
            display: "flex",
            alignItems: "center",
            gap: 8,
            marginBottom: 4,
          }}
        >
          <span style={{ color: "var(--ink-3)" }}>~</span>
          <span style={{ color: "var(--ink-4)" }}>$</span>
          <span style={{ fontWeight: 600 }}>sudo login</span>
        </div>
        <div
          className="mono"
          style={{ fontSize: 11, color: "var(--ink-4)", marginBottom: 22 }}
        >
          // admin only
        </div>

        <form
          onSubmit={onSubmit}
          style={{ display: "flex", flexDirection: "column", gap: 12 }}
          autoComplete="off"
        >
          <label
            className="mono"
            style={{
              fontSize: 11,
              color: "var(--ink-3)",
              letterSpacing: "0.05em",
              display: "flex",
              flexDirection: "column",
              gap: 6,
            }}
          >
            username
            <input
              name="username"
              type="text"
              required
              autoFocus
              autoComplete="username"
              style={inputStyle}
            />
          </label>
          <label
            className="mono"
            style={{
              fontSize: 11,
              color: "var(--ink-3)",
              letterSpacing: "0.05em",
              display: "flex",
              flexDirection: "column",
              gap: 6,
            }}
          >
            password
            <input
              name="password"
              type="password"
              required
              autoComplete="current-password"
              style={inputStyle}
            />
          </label>

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

          <button
            type="submit"
            disabled={busy}
            style={{
              height: 36,
              padding: "0 14px",
              background: "var(--ink)",
              color: "var(--bg)",
              border: "1px solid var(--ink)",
              fontFamily: "var(--mono)",
              fontSize: 13,
              cursor: busy ? "wait" : "pointer",
              opacity: busy ? 0.7 : 1,
              marginTop: 4,
            }}
          >
            {busy ? "..." : "sign in"}
          </button>
        </form>
      </div>
    </div>
  );
}

const inputStyle: React.CSSProperties = {
  height: 34,
  padding: "0 10px",
  background: "var(--bg)",
  color: "var(--ink)",
  border: "1px solid var(--line-2)",
  fontFamily: "var(--mono)",
  fontSize: 13,
  outline: "none",
};
