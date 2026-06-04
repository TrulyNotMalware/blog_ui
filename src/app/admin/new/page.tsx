import { EditorForm } from "@/components/modules/admin/EditorForm";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Admin · new post",
};

export default function AdminNewPage() {
  return <EditorForm mode="new" />;
}
