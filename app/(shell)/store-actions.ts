"use server";

import { eq } from "drizzle-orm";
import { product } from "@/db/schema";
import { validateCoupon } from "@/lib/coupons";
import { db } from "@/lib/db";
import { getSession } from "@/lib/session";
import { checkOrderStatus, createOrder } from "@/lib/store";

export async function createOrderAction(productId: string, couponCode?: string) {
  const session = await getSession();
  if (!session) return { error: "Masuk dulu untuk membeli." };
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
  if (!session) return { error: "Masuk dulu untuk membeli." };
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
  if (!p || p.price <= 0) return { error: "Produk tidak dijual." };
  return validateCoupon(code, p.price);
}

export async function checkOrderStatusAction(orderId: string) {
  const session = await getSession();
  if (!session) return { error: "Harus masuk." };
  return checkOrderStatus(orderId, session.user.id);
}
