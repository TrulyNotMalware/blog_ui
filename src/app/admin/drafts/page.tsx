import { ResponsiveSwitch } from "@/components/layout/ResponsiveSwitch";
import { AdminPosts } from "@/components/modules/admin/Posts";
import { AdminShortcuts } from "@/components/modules/admin/AdminShortcuts";
import { MobileAdmin } from "@/components/modules/mobile/Mobile";
import { serverPostService } from "@/server/serverPostService";
import type { AdminPostRow } from "@/types";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Admin · drafts",
};

export default async function AdminDraftsPage() {
  const data = await serverPostService.adminList({ pageSize: 100, status: "draft" });
  const rows: AdminPostRow[] = data.items.map(({ id, title, status, kind, tags, views, updatedAt }) => ({
    id,
    title,
    status,
    kind,
    tags,
    views,
    updatedAt,
  }));
  return (
    <>
      <AdminShortcuts />
      <ResponsiveSwitch
        desktop={<AdminPosts rows={rows} total={data.total} activeFilter="draft" shellTab="drafts" />}
        mobile={<MobileAdmin rows={rows} activeFilter="draft" />}
      />
    </>
  );
}
