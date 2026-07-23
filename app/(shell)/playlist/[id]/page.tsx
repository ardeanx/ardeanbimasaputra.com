import { ListVideo } from "lucide-react";
import { notFound } from "next/navigation";
import VideoCard from "@/components/cards/VideoCard";
import DeletePlaylistButton from "@/components/playlist/DeletePlaylistButton";
import EmptyState from "@/components/ui/EmptyState";
import { getT } from "@/lib/i18n";
import { getPlaylist } from "@/lib/playlists";
import { getSession } from "@/lib/session";

export const dynamic = "force-dynamic";

export default async function PlaylistPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const t = await getT();
  const session = await getSession();
  const viewerId = session?.user.id ?? null;
  const pl = await getPlaylist(id, viewerId);
  if (!pl) notFound();

  const isOwner = pl.userId === viewerId;

  return (
    <div className="mx-auto max-w-[1284px] px-6 pb-16 pt-6">
      <div className="mb-6 flex items-start justify-between gap-4">
        <div className="min-w-0">
          <h1 className="text-2xl font-semibold">{pl.title}</h1>
          <p className="mt-1 text-sm text-yt-text2">
            {pl.owner.name} · {t("channel.contentCount", { n: pl.posts.length })}
            {pl.visibility === "PRIVATE" ? ` · ${t("playlist.private")}` : ""}
          </p>
          {pl.description && (
            <p className="mt-2 max-w-2xl text-sm text-yt-text2">{pl.description}</p>
          )}
        </div>
        {isOwner && <DeletePlaylistButton id={pl.id} />}
      </div>

      {pl.posts.length === 0 ? (
        <EmptyState
          icon={<ListVideo />}
          title={t("playlist.pageEmpty")}
          action={{ label: t("nav.explore"), href: "/" }}
        />
      ) : (
        <div className="card-grid">
          {pl.posts.map((p) => (
            <VideoCard key={p.id} post={p} />
          ))}
        </div>
      )}
    </div>
  );
}
