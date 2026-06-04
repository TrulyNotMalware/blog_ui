import { notFound } from "next/navigation";
import { ApiError } from "@/api/client";
import { ResponsiveSwitch } from "@/components/layout/ResponsiveSwitch";
import { Tags } from "@/components/modules/blog/Tags";
import { MobileTags } from "@/components/modules/mobile/Mobile";
import { tagService } from "@/services/tagService";

export const revalidate = 60;

interface PageProps {
  params: Promise<{ name: string }>;
}

export async function generateStaticParams(): Promise<{ name: string }[]> {
  const tags = await tagService.list();
  return tags.map((t) => ({ name: t.name }));
}

export async function generateMetadata({ params }: PageProps) {
  const { name } = await params;
  return { title: `#${name} · tags` };
}

export default async function TagDetailPage({ params }: PageProps) {
  const { name } = await params;

  const [detailResult, tagsResult] = await Promise.allSettled([
    tagService.detail(name),
    tagService.list(),
  ]);

  if (detailResult.status === "rejected") {
    const error = detailResult.reason;
    if (error instanceof ApiError && error.status === 404) notFound();
    throw error;
  }
  if (tagsResult.status === "rejected") throw tagsResult.reason;

  const detail = detailResult.value;
  const tags = tagsResult.value;

  return (
    <ResponsiveSwitch
      desktop={<Tags selected={detail.tag.name} tags={tags} posts={detail.posts} />}
      mobile={<MobileTags selected={detail.tag.name} tags={tags} posts={detail.posts} />}
    />
  );
}
