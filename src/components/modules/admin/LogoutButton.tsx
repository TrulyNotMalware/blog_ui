"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function LogoutButton() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function onClick() {
    setBusy(true);
    try {
      await fetch("/api/admin/auth/logout", { method: "POST" });
    } finally {
      router.push("/admin/login");
      router.refresh();
    }
  }

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={busy}
      className="mono"
      style={{
        height: 30,
        padding: "0 12px",
        background: "transparent",
        color: "var(--ink-3)",
        border: "1px solid var(--line-2)",
        fontFamily: "var(--mono)",
        fontSize: 11,
        cursor: busy ? "wait" : "pointer",
        textDecoration: "none",
        letterSpacing: "0.05em",
      }}
    >
      logout
    </button>
  );
}
