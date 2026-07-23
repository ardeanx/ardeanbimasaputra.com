"use server";

import { eq } from "drizzle-orm";
import { product } from "@/db/schema";
import { validateCoupon } from "@/lib/coupons";
import { db } from "@/lib/db";
import { getSession } from "@/lib/session";
import { getT } from "@/lib/i18n";
import { checkOrderStatus, createOrder } from "@/lib/store";

export async function createOrderAction(productId: string, couponCode?: string) {
  const session = await getSession();
  if (!session) return { error: (await getT())("msg.signInToBuy") };
  return createOrder(
    {
      id: session.user.id,
      name: session.user.name,
      email: session.user.email,
    },
    productId,
    couponCode,
  );
}

export async function createBankTransferOrderAction(productId: string, couponCode?: string) {
  const session = await getSession();
  if (!session) return { error: (await getT())("msg.signInToBuy") };
  return createOrder(
    {
      id: session.user.id,
      name: session.user.name,
      email: session.user.email,
    },
    productId,
    couponCode,
    "bank",
  );
}

export async function validateCouponAction(productId: string, code: string) {
  const p = await db.query.product.findFirst({
    where: eq(product.id, productId),
  });
  if (!p || p.price <= 0) return { error: (await getT())("store.err.notForSale") };
  return validateCoupon(code, p.price);
}

export async function checkOrderStatusAction(orderId: string) {
  const session = await getSession();
  if (!session) return { error: (await getT())("msg.mustSignIn") };
  return checkOrderStatus(orderId, session.user.id);
}
