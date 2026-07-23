"use server";

import { revalidatePath } from "next/cache";
import { createReport, resolveReport } from "@/lib/reports";
import { REPORT_REASONS, type ReportReason } from "@/lib/report-reasons";
import { getSession, isAdminUser } from "@/lib/session";

export async function createReportAction(input: {
  postId: string;
  reason: string;
  detail?: string;
}): Promise<{ ok: true } | { error: string }> {
  const session = await getSession();
  if (!session) return { error: "report.errorAuth" };
  if (!REPORT_REASONS.includes(input.reason as ReportReason))
    return { error: "report.errorReason" };
  await createReport({
    postId: input.postId,
    reporterId: session.user.id,
    reason: input.reason,
    detail: input.detail,
  });
  return { ok: true };
}

export async function resolveReportAction(
  id: string,
  status: "RESOLVED" | "DISMISSED",
): Promise<{ ok: true } | { error: string }> {
  const session = await getSession();
  if (!session || !isAdminUser(session.user as { role?: string | null }))
    return { error: "common.forbidden" };
  await resolveReport(id, status, session.user.id);
  revalidatePath("/studio/content");
  return { ok: true };
}
