import { notFound } from "next/navigation";
import { ApiError } from "@/api/client";
import { EditorForm } from "@/components/modules/admin/EditorForm";
import { serverPostService } from "@/server/serverPostService";
import type { PostAdmin } from "@/types";

export const dynamic = "force-dynamic";

interface PageProps {
  params: Promise<{ id: string }>;
}

function decodeId(raw: string): string {
  try {
    return decodeURIComponent(raw);
  } catch {
    notFound();
  }
}

export async function generateMetadata({ params }: PageProps) {
  const { id: rawId } = await params;
  const id = decodeId(rawId);
  return { title: `Admin · edit · ${id}` };
}

export default async function AdminEditPage({ params }: PageProps) {
  const { id: rawId } = await params;
  // Next.js 16 page params arrive URL-encoded; decode before passing to service
  const id = decodeId(rawId);
  let post: PostAdmin;
  try {
    post = await serverPostService.adminDetail(id);
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) notFound();
    throw error;
  }
  return <EditorForm mode="edit" initial={post} />;
}
