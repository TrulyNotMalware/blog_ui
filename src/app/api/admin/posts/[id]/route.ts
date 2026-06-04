import type { NextRequest } from "next/server";
import { forwardToBeAsAdmin } from "@/server/adminProxy";

interface RouteCtx {
  params: Promise<{ id: string }>;
}

export async function GET(request: NextRequest, ctx: RouteCtx) {
  const { id } = await ctx.params;
  return forwardToBeAsAdmin({
    method: "GET",
    bePath: `admin/posts/${encodeURIComponent(id)}`,
    request,
  });
}

export async function PATCH(request: NextRequest, ctx: RouteCtx) {
  const { id } = await ctx.params;
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "invalid_json" }, { status: 400 });
  }
  return forwardToBeAsAdmin({
    method: "PATCH",
    bePath: `posts/${encodeURIComponent(id)}`,
    body,
    request,
  });
}

export async function DELETE(request: NextRequest, ctx: RouteCtx) {
  const { id } = await ctx.params;
  return forwardToBeAsAdmin({
    method: "DELETE",
    bePath: `posts/${encodeURIComponent(id)}`,
    request,
  });
}
