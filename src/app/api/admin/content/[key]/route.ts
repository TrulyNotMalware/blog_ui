import type { NextRequest } from "next/server";
import { forwardToBeAsAdmin } from "@/server/adminProxy";
import { CONTENT_CACHE_TAG } from "@/services/contentService";

interface RouteCtx {
  params: Promise<{ key: string }>;
}

export async function GET(request: NextRequest, ctx: RouteCtx) {
  const { key } = await ctx.params;
  return forwardToBeAsAdmin({
    method: "GET",
    bePath: `content/${encodeURIComponent(key)}`,
    request,
  });
}

export async function PUT(request: NextRequest, ctx: RouteCtx) {
  const { key } = await ctx.params;
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "invalid_json" }, { status: 400 });
  }
  return forwardToBeAsAdmin({
    method: "PUT",
    bePath: `content/${encodeURIComponent(key)}`,
    body,
    request,
    revalidateTags: [CONTENT_CACHE_TAG],
  });
}
