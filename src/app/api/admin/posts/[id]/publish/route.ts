import type { NextRequest } from "next/server";
import { forwardToBeAsAdmin } from "@/server/adminProxy";

interface RouteCtx {
  params: Promise<{ id: string }>;
}

export async function POST(request: NextRequest, ctx: RouteCtx) {
  const { id } = await ctx.params;
  return forwardToBeAsAdmin({
    method: "POST",
    bePath: `posts/${encodeURIComponent(id)}/publish`,
    request,
  });
}
