import { ResponsiveSwitch } from "@/components/layout/ResponsiveSwitch";
import { Tags } from "@/components/modules/blog/Tags";
import { MobileTags } from "@/components/modules/mobile/Mobile";
import { postService } from "@/services/postService";
import { tagService } from "@/services/tagService";

export const revalidate = 300;

export default async function TagsIndexPage() {
  const [tags, posts] = await Promise.all([
    tagService.list(),
    postService.list({ pageSize: 100 }),
  ]);
  return (
    <ResponsiveSwitch
      desktop={<Tags tags={tags} posts={posts.items} />}
      mobile={<MobileTags tags={tags} posts={posts.items} />}
    />
  );
}
