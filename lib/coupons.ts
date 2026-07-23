import { desc, eq, sql } from "drizzle-orm";
import { coupon } from "@/db/schema";
import { db } from "./db";
import { getT } from "./i18n";
import type { Actor } from "./session";

export function computeDiscount(
  c: { type: "PERCENT" | "FIXED"; value: number },
  amount: number,
): number {
  const d = c.type === "PERCENT" ? Math.floor((amount * c.value) / 100) : c.value;
  return Math.min(Math.max(0, d), amount);
}

export async function validateCoupon(
  code: string,
  amount: number,
  now = Date.now(),
): Promise<{ code: string; discount: number; finalAmount: number } | { error: string }> {
  const t = await getT();
  const norm = code.trim().toUpperCase();
  if (!norm) return { error: t("coupon.err.empty") };
  const c = await db.query.coupon.findFirst({ where: eq(coupon.code, norm) });
  if (!c || !c.active) return { error: t("coupon.err.invalid") };
  if (c.expiresAt && c.expiresAt.getTime() < now) return { error: t("coupon.err.expired") };
  if (c.maxUses !== null && c.uses >= c.maxUses) return { error: t("coupon.err.exhausted") };
  if (c.minAmount !== null && amount < c.minAmount)
    return { error: t("coupon.err.minAmount", { amount: c.minAmount }) };
  const discount = computeDiscount(c, amount);
  return { code: norm, discount, finalAmount: amount - discount };
}

export async function recordCouponUse(code: string): Promise<void> {
  await db
    .update(coupon)
    .set({ uses: sql`${coupon.uses} + 1` })
    .where(eq(coupon.code, code));
}

export async function createCoupon(
  actor: Actor,
  input: {
    code: string;
    type: "PERCENT" | "FIXED";
    value: number;
    minAmount?: number | null;
    maxUses?: number | null;
    expiresAt?: Date | null;
  },
): Promise<{ ok: true } | { error: string }> {
  const t = await getT();
  if (actor.role !== "admin") return { error: t("common.adminOnly") };
  const code = input.code.trim().toUpperCase();
  if (!/^[A-Z0-9_-]{3,32}$/.test(code)) return { error: t("coupon.err.codeFormat") };
  if (input.value <= 0) return { error: t("coupon.err.valuePositive") };
  if (input.type === "PERCENT" && input.value > 100) return { error: t("coupon.err.percentMax") };
  const existing = await db.query.coupon.findFirst({
    where: eq(coupon.code, code),
  });
  if (existing) return { error: t("coupon.err.exists") };
  await db.insert(coupon).values({
    code,
    type: input.type,
    value: input.value,
    minAmount: input.minAmount ?? null,
    maxUses: input.maxUses ?? null,
    expiresAt: input.expiresAt ?? null,
  });
  return { ok: true };
}

export async function listCoupons() {
  return db.select().from(coupon).orderBy(desc(coupon.createdAt));
}

export async function setCouponActive(
  actor: Actor,
  code: string,
  active: boolean,
): Promise<{ ok: true } | { error: string }> {
  if (actor.role !== "admin") return { error: (await getT())("common.adminOnly") };
  await db.update(coupon).set({ active }).where(eq(coupon.code, code.toUpperCase()));
  return { ok: true };
}

export async function deleteCoupon(
  actor: Actor,
  code: string,
): Promise<{ ok: true } | { error: string }> {
  if (actor.role !== "admin") return { error: (await getT())("common.adminOnly") };
  await db.delete(coupon).where(eq(coupon.code, code.toUpperCase()));
  return { ok: true };
}
