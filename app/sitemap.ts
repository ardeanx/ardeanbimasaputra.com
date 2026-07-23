import { and, eq } from "drizzle-orm";
import type { MetadataRoute } from "next";
import { page, post, product, qnaQuestion, threadPost, threadTopic, user } from "@/db/schema";
import { db } from "@/lib/db";
import { baseUrl } from "@/lib/seo";

export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const BASE = baseUrl();
  const posts = await db
    .select({
      id: post.id,
      slug: post.slug,
      type: post.type,
      noindex: post.noindex,
      updatedAt: post.updatedAt,
    })
    .from(post)
    .where(and(eq(post.status, "PUBLISHED"), eq(post.visibility, "PUBLIC")));
  const products = await db
    .select({ slug: product.slug, updatedAt: product.updatedAt })
    .from(product)
    .where(eq(product.status, "PUBLISHED"));
  const users = await db.select({ username: user.username }).from(user);
  const questions = await db
    .select({ id: qnaQuestion.id, createdAt: qnaQuestion.createdAt })
    .from(qnaQuestion);
  const topics = await db
    .select({ slug: threadTopic.slug, createdAt: threadTopic.createdAt })
    .from(threadTopic);
  const threadPosts = await db
    .select({ id: threadPost.id, createdAt: threadPost.createdAt })
    .from(threadPost)
    .where(eq(threadPost.removed, false));
  const pages = await db
    .select({ slug: page.slug, updatedAt: page.updatedAt })
    .from(page)
    .where(eq(page.status, "PUBLISHED"));

  return [
    { url: BASE, changeFrequency: "daily", priority: 1 },
    { url: `${BASE}/store`, changeFrequency: "daily", priority: 0.8 },
    { url: `${BASE}/resources`, changeFrequency: "daily", priority: 0.8 },
    { url: `${BASE}/qna`, changeFrequency: "daily", priority: 0.8 },
    { url: `${BASE}/threads`, changeFrequency: "daily", priority: 0.8 },
    ...posts
      .filter((p) => !p.noindex)
      .map((p) => ({
        url: `${BASE}/${p.slug}`,
        lastModified: p.updatedAt,
        changeFrequency: "weekly" as const,
        priority: 0.7,
      })),
    ...products.map((p) => ({
      url: `${BASE}/store/${p.slug}`,
      lastModified: p.updatedAt,
      changeFrequency: "weekly" as const,
      priority: 0.6,
    })),
    ...users
      .filter((u) => u.username)
      .map((u) => ({
        url: `${BASE}/@${u.username}`,
        changeFrequency: "weekly" as const,
        priority: 0.5,
      })),
    ...questions.map((q) => ({
      url: `${BASE}/qna/${q.id}`,
      lastModified: q.createdAt,
      changeFrequency: "weekly" as const,
      priority: 0.5,
    })),
    ...topics.map((tp) => ({
      url: `${BASE}/threads/c/${tp.slug}`,
      lastModified: tp.createdAt,
      changeFrequency: "weekly" as const,
      priority: 0.5,
    })),
    ...threadPosts.map((tp) => ({
      url: `${BASE}/threads/p/${tp.id}`,
      lastModified: tp.createdAt,
      changeFrequency: "weekly" as const,
      priority: 0.4,
    })),
    ...pages.map((pg) => ({
      url: `${BASE}/${pg.slug}`,
      lastModified: pg.updatedAt,
      changeFrequency: "weekly" as const,
      priority: 0.5,
    })),
  ];
}
