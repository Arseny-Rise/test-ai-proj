import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { pullChanges, pushChanges } from "@/lib/sync/server";
import type { SyncChange } from "@/lib/types";

export async function GET(request: Request) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const since = searchParams.get("since") ?? undefined;
  const data = await pullChanges(session.userId, since);
  return NextResponse.json(data);
}

export async function POST(request: Request) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await request.json()) as { changes?: SyncChange[] };
  const changes = body.changes ?? [];
  const result = await pushChanges(session.userId, changes);
  return NextResponse.json(result);
}
