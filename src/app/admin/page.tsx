import { ResponsiveSwitch } from "@/components/layout/ResponsiveSwitch";
import { AdminPosts } from "@/components/modules/admin/Posts";
import { AdminShortcuts } from "@/components/modules/admin/AdminShortcuts";
import { MobileAdmin } from "@/components/modules/mobile/Mobile";
import { serverPostService } from "@/server/serverPostService";
import type { AdminPostRow, PostStatus } from "@/types";

export const dynamic = "force-dynamic"; // admin: never cache

export const metadata = {
  title: "Admin · posts",
};

interface PageProps {
  searchParams: Promise<{ status?: string }>;
}

const VALID_STATUSES: ReadonlySet<string> = new Set([
  "all",
  "published",
  "draft",
  "scheduled",
]);

export default async function AdminPage({ searchParams }: PageProps) {
  const sp = await searchParams;
  const rawStatus = sp.status && VALID_STATUSES.has(sp.status) ? sp.status : "all";
  const status: "all" | PostStatus = rawStatus as "all" | PostStatus;

  const data = await serverPostService.adminList({
    pageSize: 100,
    ...(status !== "all" ? { status } : {}),
  });
  const rows: AdminPostRow[] = data.items.map(({ id, title, status: s, kind, tags, views, updatedAt }) => ({
    id,
    title,
    status: s,
    kind,
    tags,
    views,
    updatedAt,
  }));
  return (
    <>
      <AdminShortcuts />
      <ResponsiveSwitch
        desktop={<AdminPosts rows={rows} total={data.total} activeFilter={status} />}
        mobile={<MobileAdmin rows={rows} activeFilter={status} />}
      />
    </>
  );
}
