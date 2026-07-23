"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { deletePlaylistAction } from "@/app/(shell)/playlist-actions";
import { askConfirm } from "@/components/ui/dialog";

export default function DeletePlaylistButton({ id }: { id: string }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  return (
    <button
      onClick={() => {
        askConfirm({
          title: "Hapus playlist ini?",
          body: "Playlist akan dihapus permanen.",
          confirmLabel: "Hapus",
          danger: true,
        }).then((ok) => {
          if (ok)
            start(async () => {
              await deletePlaylistAction(id);
              router.push("/feed/playlist");
            });
        });
      }}
      disabled={pending}
      className="h-9 rounded-full bg-yt-chip px-4 text-sm font-medium text-red-500 hover:bg-yt-chip-hover disabled:opacity-50"
    >
      Hapus playlist
    </button>
  );
}
