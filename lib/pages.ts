import { and, asc, eq } from "drizzle-orm";
import { page } from "@/db/schema";
import { db } from "./db";
import { getT } from "./i18n";
import { genId } from "./id";
import { slugify } from "./posts";

export type PageRow = typeof page.$inferSelect;

export type PageInput = {
  id?: string;
  slug: string;
  title: string;
  body: unknown;
  status: "DRAFT" | "PUBLISHED";
  seoTitle?: string | null;
  seoDescription?: string | null;
  ogImage?: string | null;
  showInFooter: boolean;
  sortOrder: number;
};

const RESERVED = new Set([
  "store",
  "resources",
  "resource",
  "post",
  "watch",
  "results",
  "feed",
  "playlist",
  "settings",
  "studio",
  "orders",
  "login",
  "register",
  "api",
  "c",
  "sitemap.xml",
  "robots.txt",
  "rss.xml",
  "llms.txt",
]);

export function isReservedSlug(slug: string): boolean {
  return RESERVED.has(slug) || slug.startsWith("@");
}

export async function getPublishedPage(slug: string): Promise<PageRow | null> {
  const row = await db.query.page.findFirst({
    where: and(eq(page.slug, slug), eq(page.status, "PUBLISHED")),
  });
  return row ?? null;
}

export async function listFooterPages(): Promise<{ slug: string; title: string }[]> {
  return db
    .select({ slug: page.slug, title: page.title })
    .from(page)
    .where(and(eq(page.status, "PUBLISHED"), eq(page.showInFooter, true)))
    .orderBy(asc(page.sortOrder), asc(page.title));
}

export async function listAllPages(): Promise<PageRow[]> {
  return db.query.page.findMany({
    orderBy: [asc(page.sortOrder), asc(page.title)],
  });
}

export async function getPage(id: string): Promise<PageRow | null> {
  const row = await db.query.page.findFirst({ where: eq(page.id, id) });
  return row ?? null;
}

async function uniquePageSlug(desired: string, excludeId?: string) {
  const base = slugify(desired) || "page";
  const clash = await db.query.page.findFirst({ where: eq(page.slug, base) });
  if (!clash || clash.id === excludeId) return base;
  return `${base}-${genId().slice(0, 5)}`;
}

export async function savePage(
  authorId: string,
  input: PageInput,
): Promise<{ id: string } | { error: string }> {
  const t = await getT();
  const desired = input.slug || input.title;
  if (isReservedSlug(slugify(desired))) {
    return { error: t("page.err.reservedSlug") };
  }
  const values = {
    title: input.title,
    body: input.body,
    status: input.status,
    seoTitle: input.seoTitle ?? null,
    seoDescription: input.seoDescription ?? null,
    ogImage: input.ogImage ?? null,
    showInFooter: input.showInFooter,
    sortOrder: input.sortOrder,
    updatedAt: new Date(),
  };
  if (input.id) {
    const existing = await getPage(input.id);
    if (!existing) return { error: t("meta.pageNotFound") };
    const slug =
      slugify(desired) && slugify(desired) !== existing.slug
        ? await uniquePageSlug(desired, input.id)
        : existing.slug;
    await db
      .update(page)
      .set({ ...values, slug })
      .where(eq(page.id, input.id));
    return { id: input.id };
  }
  const id = genId();
  const slug = await uniquePageSlug(desired);
  await db.insert(page).values({ id, slug, authorId, ...values });
  return { id };
}

export async function deletePage(id: string): Promise<void> {
  await db.delete(page).where(eq(page.id, id));
}
