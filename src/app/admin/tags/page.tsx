import { AdminShell } from "@/components/modules/admin/Shell";
import { API_BASE_URL } from "@/constants";
import { ADMIN_ACCESS_COOKIE } from "@/server/adminProxy";
import type { Tag } from "@/types";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Admin · tags",
};

async function fetchTags(): Promise<Tag[]> {
  const base = API_BASE_URL.endsWith("/") ? API_BASE_URL : `${API_BASE_URL}/`;
  const res = await fetch(`${base}tags`, { cache: "no-store" });
  if (!res.ok) throw new Error(`Failed to fetch tags: ${res.status}`);
  return res.json();
}

export default async function AdminTagsPage() {
  const store = await cookies();
  if (!store.get(ADMIN_ACCESS_COOKIE)?.value) {
    redirect("/admin/login");
  }

  const tags = await fetchTags();

  return (
    <AdminShell tab="tags" counts={{ tags: tags.length }}>
      <div style={{ padding: "0 36px" }}>
        <div
          className="mono"
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 80px",
            gap: 16,
            padding: "10px 12px",
            fontSize: 10,
            color: "var(--ink-4)",
            letterSpacing: "0.12em",
            textTransform: "uppercase",
            borderBottom: "1px solid var(--line)",
          }}
        >
          <span>tag</span>
          <span style={{ textAlign: "right" }}>posts</span>
        </div>

        {tags.length === 0 && (
          <div
            className="mono"
            style={{
              padding: "28px 12px",
              fontSize: 12,
              color: "var(--ink-4)",
              textAlign: "center",
            }}
          >
            // no tags
          </div>
        )}

        {tags.map((tag) => (
          <div
            key={tag.name}
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 80px",
              gap: 16,
              padding: "14px 12px",
              alignItems: "center",
              borderBottom: "1px dashed var(--line)",
            }}
          >
            <span
              className="mono"
              style={{ fontSize: 13, color: "var(--ink)" }}
            >
              #{tag.name}
            </span>
            <span
              className="mono"
              style={{ fontSize: 12, color: "var(--ink-3)", textAlign: "right" }}
            >
              {tag.count}
            </span>
          </div>
        ))}
      </div>

      <div
        className="mono"
        style={{
          padding: "14px 36px",
          borderTop: "1px solid var(--line)",
          background: "var(--bg-1)",
          fontSize: 11,
          color: "var(--ink-4)",
        }}
      >
        {tags.length} tags total
      </div>
    </AdminShell>
  );
}
