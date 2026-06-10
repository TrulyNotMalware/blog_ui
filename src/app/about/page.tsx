import { About } from "@/components/modules/blog/About";
import { getAbout } from "@/services/contentService";

export const revalidate = 60;

export const metadata = {
  title: "About",
};

export default async function AboutPage() {
  const about = await getAbout();
  return (
    <About
      headline={about.headline}
      paragraphs={about.paragraphs}
      now={about.now}
      stack={about.stack}
      contact={about.contact}
    />
  );
}
