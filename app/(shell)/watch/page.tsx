import { notFound, permanentRedirect } from "next/navigation";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function Watch({ searchParams }: { searchParams: Promise<{ v?: string }> }) {
  const { v } = await searchParams;
  if (!v) notFound();
  const p = await db.query.post.findFirst({
    where: (t, { eq }) => eq(t.id, v),
    columns: { slug: true },
  });
  if (!p) notFound();
  permanentRedirect(`/${p.slug}`);
}
