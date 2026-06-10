import { notFound } from "next/navigation";
import { ResponsiveSwitch } from "@/components/layout/ResponsiveSwitch";
import { HomeCards } from "@/components/modules/blog/HomeCards";
import { HomeList } from "@/components/modules/blog/HomeList";
import { MobileHome } from "@/components/modules/mobile/Mobile";
import { postService } from "@/services/postService";
import { getIntro } from "@/services/contentService";

export const revalidate = 60;

const PAGE_SIZE = 10;

interface PageProps {
  searchParams: Promise<{ page?: string; view?: string }>;
}

export default async function HomePage({ searchParams }: PageProps) {
  const sp = await searchParams;
  const requested = Number(sp.page ?? "1") || 1;
  const page = Math.max(1, requested);
  const view: "list" | "cards" = sp.view === "list" ? "list" : "cards";

  const [data, intro] = await Promise.all([
    postService.list({ page, pageSize: PAGE_SIZE }),
    getIntro(),
  ]);
  const totalPages = Math.max(1, Math.ceil(data.total / PAGE_SIZE));

  // Out-of-range page → 404 instead of rendering an empty grid (and letting bots
  // mint empty cached pages at ?page=99999).
  if (page > totalPages) notFound();

  const desktop =
    view === "list" ? (
      <HomeList posts={data.items} page={page} totalPages={totalPages} introLines={intro.lines} />
    ) : (
      <HomeCards posts={data.items} page={page} totalPages={totalPages} introLines={intro.lines} />
    );

  return (
    <ResponsiveSwitch
      desktop={desktop}
      mobile={<MobileHome posts={data.items} page={page} totalPages={totalPages} />}
    />
  );
}
