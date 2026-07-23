import { NextResponse } from "next/server";
import { removeSubscription, saveSubscription } from "@/lib/push";
import { getSession } from "@/lib/session";

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const endpoint = typeof body?.endpoint === "string" ? body.endpoint : "";
  const p256dh = typeof body?.keys?.p256dh === "string" ? body.keys.p256dh : "";
  const authKey = typeof body?.keys?.auth === "string" ? body.keys.auth : "";
  if (!endpoint.startsWith("https://") || !p256dh || !authKey) {
    return NextResponse.json({ error: "bad request" }, { status: 400 });
  }
  const session = await getSession();
  await saveSubscription(session?.user.id ?? null, {
    endpoint,
    keys: { p256dh, auth: authKey },
  });
  return NextResponse.json({ ok: true });
}

export async function DELETE(req: Request) {
  const body = await req.json().catch(() => null);
  if (typeof body?.endpoint !== "string") {
    return NextResponse.json({ error: "bad request" }, { status: 400 });
  }
  await removeSubscription(body.endpoint);
  return NextResponse.json({ ok: true });
}
