import { AdminShell } from "@/components/modules/admin/Shell";
import { AboutEditor, IntroEditor } from "@/components/modules/admin/ContentEditor";
import { serverContentService } from "@/server/serverContentService";
import { DEFAULT_ABOUT, DEFAULT_INTRO, mergeAbout, mergeIntro } from "@/services/contentService";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Admin · content",
};

export default async function AdminContentPage() {
  const [aboutData, introData] = await Promise.all([
    serverContentService.about(),
    serverContentService.intro(),
  ]);

  const about = aboutData != null ? mergeAbout(aboutData) : DEFAULT_ABOUT;
  const intro = introData != null ? mergeIntro(introData) : DEFAULT_INTRO;

  return (
    <AdminShell tab="content">
      <div style={{ padding: "32px 36px" }}>
        <IntroEditor initial={intro} />
        <div style={{ borderTop: "1px dashed var(--line)", marginBottom: 40 }} />
        <AboutEditor initial={about} />
      </div>
    </AdminShell>
  );
}
