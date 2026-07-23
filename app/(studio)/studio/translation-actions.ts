"use server";

import { eq } from "drizzle-orm";
import { post } from "@/db/schema";
import {
  autoTranslatePost,
  deleteTranslation,
  getTranslation,
  listTranslations,
  upsertTranslation,
} from "@/lib/content-translation";
import { db } from "@/lib/db";
import { DEFAULT_LOCALE, getT, listLocales } from "@/lib/i18n";
import { revalidateContent } from "@/lib/revalidate";
import { getSession } from "@/lib/session";

export type TranslationInfo = {
  locale: string;
  title: string;
  excerpt: string | null;
  auto: boolean;
  updatedAt: Date;
};

type PostRow = typeof post.$inferSelect;

async function guard(postId: string): Promise<{ post: PostRow } | { error: string }> {
  const t = await getT();
  const session = await getSession();
  if (!session) return { error: t("msg.sessionExpired") };
  const p = await db.query.post.findFirst({ where: eq(post.id, postId) });
  if (!p) return { error: t("msg.contentNotFound") };
  const role = (session.user as { role?: string | null }).role;
  if (p.authorId !== session.user.id && role !== "admin") {
    return { error: t("msg.notAuthorized") };
  }
  return { post: p };
}

async function validLocale(locale: string): Promise<boolean> {
  if (locale === DEFAULT_LOCALE) return false;
  const locales = await listLocales();
  return locales.includes(locale);
}

export async function listTranslationsAction(
  postId: string,
): Promise<TranslationInfo[] | { error: string }> {
  const g = await guard(postId);
  if ("error" in g) return g;
  const rows = await listTranslations(postId);
  return rows.map((r) => ({
    locale: r.locale,
    title: r.title,
    excerpt: r.excerpt,
    auto: r.auto,
    updatedAt: r.updatedAt,
  }));
}

export async function autoTranslateAction(
  postId: string,
  locale: string,
): Promise<{ ok: true } | { error: string }> {
  const g = await guard(postId);
  if ("error" in g) return g;
  if (!(await validLocale(locale))) return { error: (await getT())("msg.unknownLanguage") };
  const res = await autoTranslatePost(g.post, locale);
  if ("error" in res) return { error: res.error };
  revalidateContent();
  return { ok: true };
}

export async function editTranslationAction(
  postId: string,
  locale: string,
  title: string,
  excerpt: string,
): Promise<{ ok: true } | { error: string }> {
  const g = await guard(postId);
  if ("error" in g) return g;
  if (!(await validLocale(locale))) return { error: (await getT())("msg.unknownLanguage") };
  const cleanTitle = title.trim();
  if (!cleanTitle) return { error: (await getT())("msg.translationTitleRequired") };
  const existing = await getTranslation(postId, locale);
  await upsertTranslation({
    postId,
    locale,
    title: cleanTitle,
    excerpt: excerpt.trim() || null,
    body: existing?.body ?? null,
    seoTitle: existing?.seoTitle ?? null,
    seoDescription: existing?.seoDescription ?? null,
    auto: false,
  });
  revalidateContent();
  return { ok: true };
}

export async function deleteTranslationAction(
  postId: string,
  locale: string,
): Promise<{ ok: true } | { error: string }> {
  const g = await guard(postId);
  if ("error" in g) return g;
  await deleteTranslation(postId, locale);
  revalidateContent();
  return { ok: true };
}
