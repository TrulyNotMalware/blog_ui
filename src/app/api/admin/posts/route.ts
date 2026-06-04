import type { NextRequest } from "next/server";
import { forwardToBeAsAdmin } from "@/server/adminProxy";

export async function GET(request: NextRequest) {
  return forwardToBeAsAdmin({
    method: "GET",
    bePath: "admin/posts",
    search: request.nextUrl.searchParams,
    request,
  });
}

export async function POST(request: NextRequest) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "invalid_json" }, { status: 400 });
  }
  return forwardToBeAsAdmin({ method: "POST", bePath: "posts", body, request });
}
