import { desc, eq } from "drizzle-orm";
import { post, report, user } from "@/db/schema";
import { db } from "@/lib/db";
import { genId } from "@/lib/id";
import type { ReportStatus } from "@/lib/report-reasons";

export type ReportRow = {
  id: string;
  reason: string;
  detail: string | null;
  status: ReportStatus;
  createdAt: Date;
  post: { id: string; title: string; slug: string } | null;
  reporterName: string | null;
};

export async function createReport(input: {
  postId: string;
  reporterId: string | null;
  reason: string;
  detail?: string | null;
}): Promise<string> {
  const id = genId();
  await db.insert(report).values({
    id,
    postId: input.postId,
    reporterId: input.reporterId,
    reason: input.reason,
    detail: input.detail?.trim() ? input.detail.trim() : null,
  });
  return id;
}

export async function listReports(): Promise<ReportRow[]> {
  const rows = await db
    .select({
      id: report.id,
      reason: report.reason,
      detail: report.detail,
      status: report.status,
      createdAt: report.createdAt,
      postId: post.id,
      postTitle: post.title,
      postSlug: post.slug,
      reporterName: user.name,
    })
    .from(report)
    .leftJoin(post, eq(report.postId, post.id))
    .leftJoin(user, eq(report.reporterId, user.id))
    .orderBy(desc(report.createdAt))
    .limit(200);

  return rows.map((r) => ({
    id: r.id,
    reason: r.reason,
    detail: r.detail,
    status: r.status,
    createdAt: r.createdAt,
    post: r.postId ? { id: r.postId, title: r.postTitle ?? "", slug: r.postSlug ?? "" } : null,
    reporterName: r.reporterName,
  }));
}

export async function resolveReport(
  id: string,
  status: "RESOLVED" | "DISMISSED",
  reviewerId: string,
): Promise<void> {
  await db
    .update(report)
    .set({ status, reviewedBy: reviewerId, reviewedAt: new Date() })
    .where(eq(report.id, id));
}
