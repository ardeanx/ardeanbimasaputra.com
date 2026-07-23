"use server";

import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { user, verificationRequest } from "@/db/schema";
import { db } from "@/lib/db";
import { genId } from "@/lib/id";
import { getSession } from "@/lib/session";

type Result = { ok: true } | { error: string };

async function adminSession() {
  const session = await getSession();
  if (!session) return null;
  const role = (session.user as { role?: string | null }).role ?? null;
  return role === "admin" ? session : null;
}

export async function createVerificationAction(input: {
  message: string;
  links: string[];
}): Promise<Result> {
  const session = await getSession();
  if (!session) return { error: "unauthorized" };
  const userId = session.user.id;

  const u = await db.query.user.findFirst({
    where: eq(user.id, userId),
    columns: { verified: true },
  });
  if (u?.verified) return { error: "already-verified" };

  const pending = await db.query.verificationRequest.findFirst({
    where: and(eq(verificationRequest.userId, userId), eq(verificationRequest.status, "PENDING")),
    columns: { id: true },
  });
  if (pending) return { error: "pending" };

  const links = input.links
    .map((l) => l.trim())
    .filter(Boolean)
    .slice(0, 5);

  await db.insert(verificationRequest).values({
    id: genId(),
    userId,
    message: input.message.trim() || null,
    links,
    status: "PENDING",
  });

  revalidatePath("/settings/account");
  revalidatePath("/studio/verification");
  return { ok: true };
}

export async function approveVerificationAction(id: string): Promise<Result> {
  const session = await adminSession();
  if (!session) return { error: "unauthorized" };

  const req = await db.query.verificationRequest.findFirst({
    where: eq(verificationRequest.id, id),
    columns: { userId: true },
  });
  if (!req) return { error: "not-found" };

  await db.transaction(async (tx) => {
    await tx.update(user).set({ verified: true }).where(eq(user.id, req.userId));
    await tx
      .update(verificationRequest)
      .set({
        status: "APPROVED",
        reviewedBy: session.user.id,
        reviewedAt: new Date(),
      })
      .where(eq(verificationRequest.id, id));
  });

  revalidatePath("/studio/verification");
  revalidatePath("/", "layout");
  return { ok: true };
}

export async function rejectVerificationAction(id: string): Promise<Result> {
  const session = await adminSession();
  if (!session) return { error: "unauthorized" };

  await db
    .update(verificationRequest)
    .set({
      status: "REJECTED",
      reviewedBy: session.user.id,
      reviewedAt: new Date(),
    })
    .where(eq(verificationRequest.id, id));

  revalidatePath("/studio/verification");
  return { ok: true };
}
