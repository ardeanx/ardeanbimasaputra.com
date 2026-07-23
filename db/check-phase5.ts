import assert from "node:assert";
import { createHash } from "node:crypto";
import { eq } from "drizzle-orm";
import { db } from "../lib/db";
import { genId } from "../lib/id";
import { verifySignature } from "../lib/midtrans";
import { hasEntitlement } from "../lib/resources";
import { applyTransaction, mapStatus } from "../lib/store";
import { order, product, user } from "./schema";

const SERVER_KEY = process.env.MIDTRANS_SERVER_KEY ?? "";

function sign(orderId: string, statusCode: string, gross: string): string {
  return createHash("sha512")
    .update(orderId + statusCode + gross + SERVER_KEY)
    .digest("hex");
}

async function main() {
  const admin = (await db.query.user.findFirst({
    where: eq(user.username, "ardean"),
  }))!;
  const member = (await db.query.user.findFirst({
    where: eq(user.username, "sintadev"),
  }))!;
  assert(admin && member, "seed user ada");

  const good = sign("ord-x", "200", "150000.00");
  assert(
    await verifySignature({
      order_id: "ord-x",
      status_code: "200",
      gross_amount: "150000.00",
      signature_key: good,
    }),
    "signature valid diterima",
  );
  assert(
    !(await verifySignature({
      order_id: "ord-x",
      status_code: "200",
      gross_amount: "150000.00",
      signature_key: "salah",
    })),
    "signature salah ditolak",
  );

  assert(mapStatus("settlement") === "PAID", "settlement -> PAID");
  assert(mapStatus("capture", "accept") === "PAID", "capture+accept -> PAID");
  assert(mapStatus("capture", "challenge") === "PENDING", "capture+challenge -> PENDING");
  assert(mapStatus("pending") === "PENDING", "pending -> PENDING");
  assert(mapStatus("expire") === "EXPIRED", "expire -> EXPIRED");
  assert(mapStatus("deny") === "FAILED", "deny -> FAILED");
  assert(mapStatus("refund") === "REFUNDED", "refund -> REFUNDED");

  const prodId = genId();
  await db.insert(product).values({
    id: prodId,
    ownerId: admin.id,
    title: "CEK Order",
    slug: `cek-order-${prodId}`,
    kind: "SOURCE_CODE",
    status: "PUBLISHED",
    price: 150000,
  });

  const oid = "ord-cek-1";
  await db.insert(order).values({
    id: oid,
    userId: member.id,
    productId: prodId,
    title: "CEK Order",
    amount: 150000,
    status: "PENDING",
  });
  const r = await applyTransaction(
    oid,
    { transaction_status: "settlement", gross_amount: "150000.00" },
    {},
  );
  assert("ok" in r, "applyTransaction settlement ok");
  const o1 = await db.query.order.findFirst({ where: eq(order.id, oid) });
  assert(o1?.status === "PAID", "order -> PAID");
  assert(o1?.paidAt !== null, "paidAt terisi");
  assert(await hasEntitlement(member.id, prodId), "entitlement diberikan setelah lunas");

  const r2 = await applyTransaction(
    oid,
    { transaction_status: "settlement", gross_amount: "150000.00" },
    {},
  );
  assert("ok" in r2, "idempoten: apply ulang tetap ok tanpa dobel");

  const refund = await applyTransaction(
    oid,
    { transaction_status: "refund", gross_amount: "150000.00" },
    {},
  );
  assert("ok" in refund, "refund diproses");
  const o3 = await db.query.order.findFirst({ where: eq(order.id, oid) });
  assert(o3?.status === "REFUNDED", "order -> REFUNDED setelah refund");
  assert(!(await hasEntitlement(member.id, prodId)), "entitlement dicabut setelah refund");

  const oid2 = "ord-cek-2";
  await db.insert(order).values({
    id: oid2,
    userId: member.id,
    productId: prodId,
    title: "CEK",
    amount: 150000,
    status: "PENDING",
  });
  const bad = await applyTransaction(
    oid2,
    { transaction_status: "settlement", gross_amount: "999" },
    {},
  );
  assert("error" in bad, "jumlah tidak cocok ditolak");
  const o2 = await db.query.order.findFirst({ where: eq(order.id, oid2) });
  assert(o2?.status === "FAILED", "order jumlah salah -> FAILED");

  await db.delete(order).where(eq(order.id, oid));
  await db.delete(order).where(eq(order.id, oid2));
  await db.delete(product).where(eq(product.id, prodId));

  console.log("check-phase5: SEMUA ASSERT LOLOS ✔");
  process.exit(0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
