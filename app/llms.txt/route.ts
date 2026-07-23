import { post } from "@/db/schema";
import { db } from "@/lib/db";
import { baseUrl } from "@/lib/seo";
import { getSettings } from "@/lib/settings";
import { and, desc, eq } from "drizzle-orm";

export const dynamic = "force-dynamic";

export async function GET() {
  const s = await getSettings();
  if (!s.seo.autoLlmTxt) return new Response("Not Found", { status: 404 });
  const url = baseUrl();
  const items = await db.query.post.findMany({
    where: and(eq(post.status, "PUBLISHED"), eq(post.visibility, "PUBLIC")),
    orderBy: [desc(post.publishedAt)],
    limit: 100,
  });
  const permalink = (p: (typeof items)[number]) => `${url}/${p.slug}`;
  const lines = [
    `# ${s.seo.siteTitle}`,
    "",
    `> ${s.seo.siteDescription}`,
    "",
    "## Content",
    "",
    ...items.map((p) => `- [${p.title}](${permalink(p)})${p.excerpt ? `: ${p.excerpt}` : ""}`),
  ];
  return new Response(lines.join("\n"), {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
}
