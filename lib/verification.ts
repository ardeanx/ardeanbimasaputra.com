import { and, desc, eq } from "drizzle-orm";
import { user, verificationRequest } from "@/db/schema";
import { db } from "@/lib/db";

export type VerifyState = "none" | "pending" | "approved" | "rejected";

export async function getVerifyState(userId: string): Promise<{
  verified: boolean;
  state: VerifyState;
}> {
  const [u, latest] = await Promise.all([
    db.query.user.findFirst({
      where: eq(user.id, userId),
      columns: { verified: true },
    }),
    db.query.verificationRequest.findFirst({
      where: eq(verificationRequest.userId, userId),
      orderBy: [desc(verificationRequest.createdAt)],
      columns: { status: true },
    }),
  ]);

  const verified = u?.verified ?? false;
  if (verified) return { verified, state: "approved" };
  if (latest?.status === "PENDING") return { verified, state: "pending" };
  if (latest?.status === "REJECTED") return { verified, state: "rejected" };
  return { verified, state: "none" };
}

export async function hasPendingRequest(userId: string): Promise<boolean> {
  const row = await db.query.verificationRequest.findFirst({
    where: and(eq(verificationRequest.userId, userId), eq(verificationRequest.status, "PENDING")),
    columns: { id: true },
  });
  return !!row;
}

export type VerifyRequestRow = {
  id: string;
  status: "PENDING" | "APPROVED" | "REJECTED";
  message: string | null;
  links: string[];
  createdAt: Date;
  requesterId: string;
  name: string;
  username: string | null;
  image: string | null;
};

export async function listVerificationRequests(): Promise<VerifyRequestRow[]> {
  const rows = await db
    .select({
      id: verificationRequest.id,
      status: verificationRequest.status,
      message: verificationRequest.message,
      links: verificationRequest.links,
      createdAt: verificationRequest.createdAt,
      requesterId: user.id,
      name: user.name,
      username: user.username,
      image: user.image,
    })
    .from(verificationRequest)
    .innerJoin(user, eq(verificationRequest.userId, user.id))
    .orderBy(desc(verificationRequest.createdAt))
    .limit(100);
  return rows;
}
