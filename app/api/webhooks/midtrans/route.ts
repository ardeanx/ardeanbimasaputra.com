import { NextResponse } from "next/server";
import { verifySignature } from "@/lib/midtrans";
import { syncOrder } from "@/lib/store";

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  if (!body?.order_id || !body?.signature_key) {
    return NextResponse.json({ error: "bad request" }, { status: 400 });
  }

  const valid = await verifySignature({
    order_id: String(body.order_id),
    status_code: String(body.status_code ?? ""),
    gross_amount: String(body.gross_amount ?? ""),
    signature_key: String(body.signature_key),
  });
  if (!valid) {
    return NextResponse.json({ error: "invalid signature" }, { status: 403 });
  }

  await syncOrder(String(body.order_id));
  return NextResponse.json({ ok: true });
}
