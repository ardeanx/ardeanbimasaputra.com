import { and, desc, eq, ne } from "drizzle-orm";
import { entitlement, order, payment, product, user } from "@/db/schema";
import { db } from "./db";
import { sendEmail } from "./email";
import { fmtPrice } from "./format";
import { getT } from "./i18n";
import { genId } from "./id";
import {
  createSnapTransaction,
  getTransactionStatus,
  isConfigured,
  type MidtransTx,
} from "./midtrans";
import { recordCouponUse, validateCoupon } from "./coupons";
import { notify, notifyAdmins } from "./notifications";
import { grantEntitlement, hasEntitlement } from "./resources";
import { getSettings } from "./settings";

export type PaymentMethod = "midtrans" | "bank";

async function notifyPurchase(productId: string, buyerId: string, amount: number): Promise<void> {
  const p = await db.query.product.findFirst({
    where: eq(product.id, productId),
    columns: { ownerId: true, title: true, slug: true },
  });
  if (!p) return;
  const meta = { productTitle: p.title, amount, productSlug: p.slug };
  await notify({ userId: p.ownerId, type: "PURCHASE", actorId: buyerId, meta });
  await notifyAdmins({ type: "PURCHASE", actorId: buyerId, meta });
}

export async function createOrder(
  buyer: { id: string; name: string; email: string },
  productId: string,
  couponCode?: string,
  method: PaymentMethod = "midtrans",
): Promise<{ orderId: string; token: string | null } | { error: string }> {
  const t = await getT();
  const settings = await getSettings();
  const midtransOn = settings.integrations.midtrans.enabled;
  const bankOn = settings.integrations.bankTransfer.enabled;
  if (!midtransOn && !bankOn) return { error: t("store.err.paymentDisabled") };
  if (method === "bank" ? !bankOn : !midtransOn) return { error: t("store.err.methodUnavailable") };
  const p = await db.query.product.findFirst({
    where: eq(product.id, productId),
  });
  if (!p || p.status !== "PUBLISHED") return { error: t("product.err.notFound") };
  if (p.price <= 0) return { error: t("store.err.notForSale") };
  if (p.ownerId === buyer.id) return { error: t("store.err.ownProduct") };
  if (await hasEntitlement(buyer.id, productId)) return { error: t("store.err.alreadyOwned") };

  let amount = p.price;
  let discount = 0;
  let appliedCode: string | null = null;
  if (couponCode) {
    const v = await validateCoupon(couponCode, p.price);
    if ("error" in v) return { error: v.error };
    amount = v.finalAmount;
    discount = v.discount;
    appliedCode = v.code;
  }

  const orderId = `ord-${genId()}`;

  if (amount <= 0) {
    await db.insert(order).values({
      id: orderId,
      userId: buyer.id,
      productId,
      title: p.title,
      amount: 0,
      discount,
      couponCode: appliedCode,
      status: "PAID",
      paidAt: new Date(),
    });
    if (appliedCode) await recordCouponUse(appliedCode);
    await grantEntitlement(buyer.id, productId, "coupon");
    await notifyPurchase(productId, buyer.id, 0);
    return { orderId, token: null };
  }

  if (method === "bank") {
    await db.insert(order).values({
      id: orderId,
      userId: buyer.id,
      productId,
      title: p.title,
      amount,
      discount,
      couponCode: appliedCode,
      status: "PENDING",
    });
    return { orderId, token: null };
  }

  if (!(await isConfigured())) return { error: t("store.err.paymentNotConfigured") };

  await db.insert(order).values({
    id: orderId,
    userId: buyer.id,
    productId,
    title: p.title,
    amount,
    discount,
    couponCode: appliedCode,
    status: "PENDING",
  });

  try {
    const { token } = await createSnapTransaction({
      orderId,
      amount,
      itemTitle: p.title,
      customer: { name: buyer.name, email: buyer.email },
    });
    await db
      .update(order)
      .set({ snapToken: token, updatedAt: new Date() })
      .where(eq(order.id, orderId));
    return { orderId, token };
  } catch {
    await db
      .update(order)
      .set({ status: "FAILED", updatedAt: new Date() })
      .where(eq(order.id, orderId));
    return { error: t("store.err.txFailed") };
  }
}

export function mapStatus(
  transactionStatus?: string,
  fraudStatus?: string,
): "PAID" | "PENDING" | "FAILED" | "EXPIRED" | "REFUNDED" {
  if (transactionStatus === "capture") return fraudStatus === "accept" ? "PAID" : "PENDING";
  if (transactionStatus === "settlement") return "PAID";
  if (transactionStatus === "pending") return "PENDING";
  if (transactionStatus === "expire") return "EXPIRED";
  if (
    transactionStatus === "refund" ||
    transactionStatus === "partial_refund" ||
    transactionStatus === "chargeback"
  )
    return "REFUNDED";
  return "FAILED";
}

export async function applyTransaction(
  orderId: string,
  tx: MidtransTx,
  raw: unknown,
): Promise<{ ok: true } | { error: string }> {
  const t = await getT();
  const o = await db.query.order.findFirst({ where: eq(order.id, orderId) });
  if (!o) return { error: t("order.err.notFound") };

  await db.insert(payment).values({
    id: genId(),
    orderId,
    transactionStatus: tx.transaction_status ?? null,
    paymentType: tx.payment_type ?? null,
    fraudStatus: tx.fraud_status ?? null,
    grossAmount: tx.gross_amount ?? null,
    raw: (raw ?? null) as object,
  });

  const next = mapStatus(tx.transaction_status, tx.fraud_status);

  if (o.status === "PAID") {
    if (next === "REFUNDED") {
      if (o.productId)
        await db
          .delete(entitlement)
          .where(and(eq(entitlement.userId, o.userId), eq(entitlement.productId, o.productId)));
      await db
        .update(order)
        .set({ status: "REFUNDED", updatedAt: new Date() })
        .where(eq(order.id, orderId));
    }
    return { ok: true };
  }

  if (next === "PAID") {
    const paid = tx.gross_amount ? Math.round(Number(tx.gross_amount)) : o.amount;
    if (paid !== o.amount) {
      await db
        .update(order)
        .set({ status: "FAILED", updatedAt: new Date() })
        .where(and(eq(order.id, orderId), ne(order.status, "PAID")));
      return { error: t("store.err.amountMismatch") };
    }
    await db
      .update(order)
      .set({ status: "PAID", paidAt: o.paidAt ?? new Date(), updatedAt: new Date() })
      .where(and(eq(order.id, orderId), ne(order.status, "PAID")));
    if (o.productId) {
      await grantEntitlement(o.userId, o.productId, "purchase");
      await notifyPurchase(o.productId, o.userId, paid);
    }
    if (o.couponCode) await recordCouponUse(o.couponCode);
    try {
      const buyer = await db.query.user.findFirst({
        where: eq(user.id, o.userId),
      });
      if (buyer?.email) {
        const title = o.title.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
        await sendEmail({
          to: buyer.email,
          subject: `Pembayaran diterima — ${o.title}`,
          html: `<p>Terima kasih! Pembayaran untuk <strong>${title}</strong> sebesar ${fmtPrice(o.amount)} telah kami terima.</p><p>ID Order: ${o.id}</p>`,
        });
      }
    } catch {}
  } else {
    await db
      .update(order)
      .set({ status: next, updatedAt: new Date() })
      .where(and(eq(order.id, orderId), ne(order.status, "PAID")));
  }
  return { ok: true };
}

export async function syncOrder(orderId: string): Promise<{ status: string } | { error: string }> {
  const o = await db.query.order.findFirst({ where: eq(order.id, orderId) });
  if (!o) return { error: (await getT())("order.err.notFound") };
  const tx = await getTransactionStatus(orderId);
  if (tx) await applyTransaction(orderId, tx, tx);
  const updated = await db.query.order.findFirst({ where: eq(order.id, orderId) });
  return { status: updated?.status ?? o.status };
}

export async function checkOrderStatus(
  orderId: string,
  requesterId: string,
): Promise<{ status: string } | { error: string }> {
  const t = await getT();
  const o = await db.query.order.findFirst({ where: eq(order.id, orderId) });
  if (!o) return { error: t("order.err.notFound") };
  if (o.userId !== requesterId) return { error: t("order.err.notYours") };
  return syncOrder(orderId);
}

export async function listOrders(userId: string) {
  return db.select().from(order).where(eq(order.userId, userId)).orderBy(desc(order.createdAt));
}

export async function getOrderFor(orderId: string, userId: string) {
  const o = await db.query.order.findFirst({
    where: eq(order.id, orderId),
    with: { product: true },
  });
  if (!o || o.userId !== userId) return null;
  return o;
}
