import { eq } from "drizzle-orm";
import { notFound } from "next/navigation";
import EditorRoot from "@/components/studio/editor/EditorRoot";
import { category, post } from "@/db/schema";
import { db } from "@/lib/db";
import { DEFAULT_LOCALE, listLocales } from "@/lib/i18n";
import { getSession } from "@/lib/session";

export const dynamic = "force-dynamic";

export default async function EditPost({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await getSession();
  const p = await db.query.post.findFirst({ where: eq(post.id, id) });
  if (!p) notFound();

  const isAdmin = (session!.user as { role?: string | null }).role === "admin";
  if (p.authorId !== session!.user.id && !isAdmin) notFound();

  const [cats, locales] = await Promise.all([
    db.select().from(category).orderBy(category.name),
    listLocales(),
  ]);

  return (
    <EditorRoot
      categories={cats}
      isAdmin={isAdmin}
      locales={locales}
      defaultLocale={DEFAULT_LOCALE}
      defaults={{
        id: p.id,
        status: p.status,
        title: p.title,
        type: p.type,
        slug: p.slug,
        categoryId: p.categoryId,
        excerpt: p.excerpt,
        thumbnail: p.thumbnail,
        visibility: p.visibility,
        mediaUrl: p.mediaUrl,
        durationSec: p.durationSec,
        repoUrl: p.repoUrl,
        seoTitle: p.seoTitle,
        seoDescription: p.seoDescription,
        ogImage: p.ogImage,
        canonicalUrl: p.canonicalUrl,
        noindex: p.noindex,
        viewCount: p.viewCount,
        body: p.body,
      }}
    />
  );
}
