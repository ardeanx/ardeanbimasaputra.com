import { desc, eq } from "drizzle-orm";
import MediaLibrary from "@/components/studio/media/MediaLibrary";
import { mediaFile, user } from "@/db/schema";
import { db } from "@/lib/db";
import { requireSession } from "@/lib/session";

export const dynamic = "force-dynamic";

export default async function StudioMedia() {
  const session = await requireSession();
  const role = (session.user as { role?: string | null }).role ?? null;
  const isAdmin = role === "admin";

  const rows = await db
    .select({
      id: mediaFile.id,
      url: mediaFile.url,
      key: mediaFile.key,
      mime: mediaFile.mime,
      size: mediaFile.size,
      createdAt: mediaFile.createdAt,
      uploader: user.name,
    })
    .from(mediaFile)
    .innerJoin(user, eq(mediaFile.uploaderId, user.id))
    .where(isAdmin ? undefined : eq(mediaFile.uploaderId, session.user.id))
    .orderBy(desc(mediaFile.createdAt));

  const items = rows.map((r) => ({
    ...r,
    createdAt: r.createdAt.toISOString(),
  }));

  return (
    <div className="mx-auto max-w-6xl px-4 py-6">
      <h1 className="mb-1 text-xl font-semibold text-yt-text">Media</h1>
      <p className="mb-6 text-sm text-yt-text2">
        {isAdmin ? "Semua berkas yang diunggah ke situs ini." : "Berkas yang Anda unggah."}
      </p>
      <MediaLibrary items={items} />
    </div>
  );
}
