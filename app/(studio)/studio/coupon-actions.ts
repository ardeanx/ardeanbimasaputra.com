"use server";

import { revalidatePath } from "next/cache";
import { createCoupon, deleteCoupon, setCouponActive } from "@/lib/coupons";
import { actorOf, getSession } from "@/lib/session";

export async function createCouponAction(input: {
  code: string;
  type: "PERCENT" | "FIXED";
  value: number;
  minAmount: number | null;
  maxUses: number | null;
  expiresAt: string | null;
}) {
  const session = await getSession();
  if (!session) return { error: "Harus masuk." };
  const res = await createCoupon(actorOf(session.user), {
    code: input.code,
    type: input.type,
    value: input.value,
    minAmount: input.minAmount,
    maxUses: input.maxUses,
    expiresAt: input.expiresAt ? new Date(input.expiresAt) : null,
  });
  revalidatePath("/studio/coupons");
  return res;
}

export async function toggleCouponAction(code: string, active: boolean) {
  const session = await getSession();
  if (!session) return { error: "Harus masuk." };
  const res = await setCouponActive(actorOf(session.user), code, active);
  revalidatePath("/studio/coupons");
  return res;
}

export async function deleteCouponAction(code: string) {
  const session = await getSession();
  if (!session) return { error: "Harus masuk." };
  const res = await deleteCoupon(actorOf(session.user), code);
  revalidatePath("/studio/coupons");
  return res;
}
