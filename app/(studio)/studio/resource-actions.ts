"use server";

import { eq } from "drizzle-orm";
import { post } from "@/db/schema";
import { db } from "@/lib/db";
import { fetchRepoArchive, parseRepo } from "@/lib/github";
import { addResourceFile, deleteResourceFile, listResourceFiles } from "@/lib/resources";
import { actorOf, getSession } from "@/lib/session";

export async function listResourceFilesAction(postId: string) {
  const session = await getSession();
  if (!session) return [];
  const p = await db.query.post.findFirst({ where: eq(post.id, postId) });
  const role = (session.user as { role?: string | null }).role ?? null;
  if (!p || (p.authorId !== session.user.id && role !== "admin")) return [];
  return listResourceFiles(postId);
}

export async function deleteResourceFileAction(
  id: string,
): Promise<{ ok: true } | { error: string }> {
  const session = await getSession();
  if (!session) return { error: "Harus masuk." };
  return deleteResourceFile(actorOf(session.user), id);
}

export async function importGithubAction(postId: string, repoInput: string) {
  const session = await getSession();
  if (!session) return { error: "Harus masuk." };
  const p = await db.query.post.findFirst({ where: eq(post.id, postId) });
  const role = (session.user as { role?: string | null }).role ?? null;
  if (!p || (p.authorId !== session.user.id && role !== "admin")) return { error: "Tidak berhak." };

  const parsed = parseRepo(repoInput);
  if (!parsed) return { error: "Format tidak valid (owner/repo)." };
  const arch = await fetchRepoArchive(parsed.owner, parsed.repo);
  if ("error" in arch) return arch;
  const res = await addResourceFile(postId, arch.filename, arch.buffer);
  if ("error" in res) return res;
  return { files: await listResourceFiles(postId) };
}
