import { and, desc, eq } from "drizzle-orm";
import { post } from "@/db/schema";
import { db } from "@/lib/db";
import { baseUrl } from "@/lib/seo";
import { getSettings } from "@/lib/settings";

export const dynamic = "force-dynamic";

function esc(s: string): string {
  return s
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

export async function GET() {
  const s = await getSettings();
  if (!s.seo.rssFeed) return new Response("Not Found", { status: 404 });
  const url = baseUrl();
  const items = await db.query.post.findMany({
    where: and(eq(post.status, "PUBLISHED"), eq(post.visibility, "PUBLIC")),
    orderBy: [desc(post.publishedAt)],
    limit: 30,
    with: { author: true },
  });
  const permalink = (p: (typeof items)[number]) => `${url}/${p.slug}`;
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
<channel>
<title>${esc(s.seo.siteTitle)}</title>
<link>${url}</link>
<description>${esc(s.seo.siteDescription)}</description>
<language>${s.system.defaultLanguage}</language>
${items
  .map(
    (p) => `<item>
<title>${esc(p.title)}</title>
<link>${permalink(p)}</link>
<guid isPermaLink="true">${permalink(p)}</guid>
<description>${esc(p.excerpt ?? "")}</description>
<pubDate>${(p.publishedAt ?? p.createdAt).toUTCString()}</pubDate>
<author>${esc(p.author.name)}</author>
</item>`,
  )
  .join("\n")}
</channel>
</rss>`;
  return new Response(xml, {
    headers: { "Content-Type": "application/rss+xml; charset=utf-8" },
  });
}
