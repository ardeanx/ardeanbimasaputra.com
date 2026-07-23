"use client";

import { Copy, FileAudio, FileVideo, Search, Trash2, Upload } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import { deleteMediaAction } from "@/app/(studio)/studio/media/actions";
import { useFmt, useT } from "@/components/i18n/I18nProvider";
import MediaPicker from "@/components/studio/MediaPicker";
import { askConfirm } from "@/components/ui/dialog";
import Modal from "@/components/ui/Modal";
import { fmtBytes } from "@/lib/format";

type MediaItem = {
  id: string;
  url: string;
  key: string;
  mime: string;
  size: number;
  createdAt: string;
  uploader: string;
};

function Thumb({
  item,
  large,
  onImgLoad,
}: {
  item: MediaItem;
  large?: boolean;
  onImgLoad?: (w: number, h: number) => void;
}) {
  if (item.mime.startsWith("image/")) {
    return (
      <img
        src={item.url}
        alt={item.key}
        onLoad={(e) => onImgLoad?.(e.currentTarget.naturalWidth, e.currentTarget.naturalHeight)}
        className={`h-full w-full ${large ? "object-contain" : "object-cover"}`}
      />
    );
  }
  if (large && item.mime.startsWith("video/")) {
    return <video src={item.url} controls className="h-full w-full" />;
  }
  if (large && item.mime.startsWith("audio/")) {
    return (
      <div className="flex h-full w-full flex-col items-center justify-center gap-3">
        <FileAudio width={40} height={40} className="text-yt-text2" />
        <audio src={item.url} controls className="w-full max-w-xs" />
      </div>
    );
  }
  const Icon = item.mime.startsWith("audio/") ? FileAudio : FileVideo;
  return (
    <div className="grid h-full w-full place-items-center">
      <Icon width={32} height={32} className="text-yt-text2" />
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-4 text-sm">
      <span className="shrink-0 text-yt-text2">{label}</span>
      <span className="break-all text-right text-yt-text">{value}</span>
    </div>
  );
}

export default function MediaLibrary({ items }: { items: MediaItem[] }) {
  const t = useT();
  const fmt = useFmt();
  const router = useRouter();
  const [q, setQ] = useState("");
  const [selected, setSelected] = useState<MediaItem | null>(null);
  const [dim, setDim] = useState<string | null>(null);
  const [uploadOpen, setUploadOpen] = useState(false);
  const [pending, startTransition] = useTransition();

  const visible = items.filter((i) => i.key.toLowerCase().includes(q.trim().toLowerCase()));

  function open(item: MediaItem) {
    setDim(null);
    setSelected(item);
  }

  function copyUrl(item: MediaItem) {
    navigator.clipboard.writeText(`${window.location.origin}${item.url}`);
    toast.success(t("studio.media.urlCopied"));
  }

  async function onDelete(item: MediaItem) {
    const ok = await askConfirm({
      title: t("studio.media.deleteTitle"),
      body: t("studio.media.deleteBody", { name: item.key }),
      confirmLabel: t("common.delete"),
      danger: true,
    });
    if (!ok) return;
    startTransition(async () => {
      const res = await deleteMediaAction(item.id);
      if ("error" in res) {
        toast.error(res.error);
      } else {
        toast.success(t("studio.media.deleted"));
        setSelected(null);
        router.refresh();
      }
    });
  }

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <div className="flex h-9 flex-1 items-center gap-2 rounded-full border border-yt-outline px-3">
          <Search width={16} height={16} className="shrink-0 text-yt-text2" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder={t("studio.media.searchPlaceholder")}
            className="w-full bg-transparent text-sm outline-none placeholder:text-yt-text2"
          />
        </div>
        <button
          type="button"
          onClick={() => setUploadOpen(true)}
          className="flex h-9 items-center gap-2 rounded-full bg-yt-cta px-4 text-sm font-medium text-white hover:brightness-110"
        >
          <Upload width={16} height={16} />
          {t("studio.media.upload")}
        </button>
      </div>

      {visible.length === 0 ? (
        <p className="py-16 text-center text-sm text-yt-text2">
          {items.length === 0 ? t("studio.media.empty") : t("studio.media.noMatch")}
        </p>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
          {visible.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => open(item)}
              className="group overflow-hidden rounded-xl border border-yt-outline/60 text-left hover:border-yt-outline"
            >
              <div className="aspect-square w-full overflow-hidden bg-yt-hover">
                <Thumb item={item} />
              </div>
              <div className="p-2">
                <p className="truncate text-xs font-medium text-yt-text">{item.key}</p>
                <p className="mt-0.5 text-[11px] text-yt-text2">
                  {fmtBytes(item.size)} &middot; {fmt.ago(item.createdAt)}
                </p>
              </div>
            </button>
          ))}
        </div>
      )}

      {selected && (
        <Modal
          open
          onClose={() => setSelected(null)}
          title={selected.key}
          size="lg"
          footer={
            <button
              type="button"
              disabled={pending}
              onClick={() => onDelete(selected)}
              className="flex h-9 items-center gap-2 rounded-full bg-red-600 px-4 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-60"
            >
              <Trash2 width={16} height={16} />
              {t("common.delete")}
            </button>
          }
        >
          <div className="grid h-72 w-full place-items-center overflow-hidden rounded-lg bg-yt-hover">
            <Thumb item={selected} large onImgLoad={(w, h) => setDim(`${w} × ${h}`)} />
          </div>
          <div className="mt-4 flex items-center gap-2">
            <a
              href={selected.url}
              target="_blank"
              rel="noopener noreferrer"
              className="min-w-0 flex-1 truncate rounded-lg border border-yt-outline px-3 py-2 text-xs text-yt-text hover:underline"
            >
              {`${window.location.origin}${selected.url}`}
            </a>
            <button
              type="button"
              onClick={() => copyUrl(selected)}
              className="flex h-9 shrink-0 items-center gap-1.5 rounded-full border border-yt-outline px-3 text-xs font-medium hover:bg-yt-hover"
            >
              <Copy width={14} height={14} />
              {t("studio.media.copy")}
            </button>
          </div>
          <div className="mt-4 space-y-2.5">
            <InfoRow label={t("studio.media.filename")} value={selected.key} />
            <InfoRow label={t("studio.media.type")} value={selected.mime} />
            <InfoRow label={t("studio.media.size")} value={fmtBytes(selected.size)} />
            {selected.mime.startsWith("image/") && dim && (
              <InfoRow label={t("studio.media.dimensions")} value={dim} />
            )}
            <InfoRow label={t("studio.media.uploaded")} value={fmt.ago(selected.createdAt)} />
            <InfoRow label={t("studio.media.uploader")} value={selected.uploader} />
          </div>
        </Modal>
      )}

      <Modal
        open={uploadOpen}
        onClose={() => setUploadOpen(false)}
        title={t("studio.media.uploadTitle")}
      >
        <MediaPicker
          onChange={() => {
            toast.success(t("studio.media.fileUploaded"));
            setUploadOpen(false);
            router.refresh();
          }}
        />
      </Modal>
    </div>
  );
}
