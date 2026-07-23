import { NextResponse } from "next/server";
import { sendPushToAll } from "@/lib/push";
import { getSession, isAdminUser } from "@/lib/session";

export async function POST() {
  const session = await getSession();
  if (!session || !isAdminUser(session.user as { role?: string | null })) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }
  const sent = await sendPushToAll();
  return NextResponse.json({ ok: true, sent });
}
