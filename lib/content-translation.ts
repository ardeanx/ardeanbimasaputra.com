import { and, eq } from "drizzle-orm";
import { post, postTranslation } from "@/db/schema";
import { db } from "./db";
import { DEFAULT_LOCALE } from "./i18n";
import { activeProvider, collectDocTexts, replaceDocTexts, translateTexts } from "./translate";

export type PostRow = typeof post.$inferSelect;
export type TranslationRow = typeof postTranslation.$inferSelect;

export async function getTranslation(
  postId: string,
  locale: string,
): Promise<TranslationRow | null> {
  const row = await db.query.postTranslation.findFirst({
    where: and(eq(postTranslation.postId, postId), eq(postTranslation.locale, locale)),
  });
  return row ?? null;
}

export async function listTranslations(postId: string): Promise<TranslationRow[]> {
  return db.query.postTranslation.findMany({
    where: eq(postTranslation.postId, postId),
  });
}

export async function upsertTranslation(args: {
  postId: string;
  locale: string;
  title: string;
  excerpt?: string | null;
  body?: unknown;
  seoTitle?: string | null;
  seoDescription?: string | null;
  auto: boolean;
}): Promise<void> {
  await db
    .insert(postTranslation)
    .values({ ...args, updatedAt: new Date() })
    .onConflictDoUpdate({
      target: [postTranslation.postId, postTranslation.locale],
      set: {
        title: args.title,
        excerpt: args.excerpt ?? null,
        body: args.body ?? null,
        seoTitle: args.seoTitle ?? null,
        seoDescription: args.seoDescription ?? null,
        auto: args.auto,
        updatedAt: new Date(),
      },
    });
}

export async function deleteTranslation(postId: string, locale: string): Promise<void> {
  await db
    .delete(postTranslation)
    .where(and(eq(postTranslation.postId, postId), eq(postTranslation.locale, locale)));
}

export async function autoTranslatePost(
  p: Pick<PostRow, "id" | "title" | "excerpt" | "body" | "seoTitle" | "seoDescription">,
  locale: string,
): Promise<{ ok: true; translation: TranslationRow } | { error: string }> {
  const bodyTexts = collectDocTexts(p.body);
  const metaTexts = [p.title, p.excerpt ?? "", p.seoTitle ?? "", p.seoDescription ?? ""];
  const res = await translateTexts([...metaTexts, ...bodyTexts], locale);
  if ("error" in res) return { error: res.error };
  const [title, excerpt, seoTitle, seoDescription, ...restBody] = res.result;
  const body = p.body ? replaceDocTexts(p.body, restBody) : null;
  await upsertTranslation({
    postId: p.id,
    locale,
    title: title || p.title,
    excerpt: excerpt || null,
    body,
    seoTitle: seoTitle || null,
    seoDescription: seoDescription || null,
    auto: true,
  });
  const saved = await getTranslation(p.id, locale);
  if (!saved) return { error: "Terjemahan gagal disimpan." };
  return { ok: true, translation: saved };
}

export async function localizePost<
  T extends Pick<PostRow, "id" | "title" | "excerpt" | "body" | "seoTitle" | "seoDescription">,
>(p: T, locale: string): Promise<T & { translatedLocale: string | null }> {
  if (locale === DEFAULT_LOCALE) return { ...p, translatedLocale: null };
  const existing = await getTranslation(p.id, locale);
  if (existing) {
    return {
      ...p,
      title: existing.title,
      excerpt: existing.excerpt ?? p.excerpt,
      body: existing.body ?? p.body,
      seoTitle: existing.seoTitle ?? p.seoTitle,
      seoDescription: existing.seoDescription ?? p.seoDescription,
      translatedLocale: locale,
    };
  }
  if (!(await activeProvider())) return { ...p, translatedLocale: null };
  const generated = await autoTranslatePost(p, locale);
  if ("error" in generated) return { ...p, translatedLocale: null };
  const t = generated.translation;
  return {
    ...p,
    title: t.title,
    excerpt: t.excerpt ?? p.excerpt,
    body: t.body ?? p.body,
    seoTitle: t.seoTitle ?? p.seoTitle,
    seoDescription: t.seoDescription ?? p.seoDescription,
    translatedLocale: locale,
  };
}
