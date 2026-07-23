"use client";

import { Trash2, Upload } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { listProductFilesAction } from "@/app/(studio)/studio/produk/actions";
import { deleteResourceFileAction } from "@/app/(studio)/studio/resource-actions";
import { useT } from "@/components/i18n/I18nProvider";
import { askConfirm } from "@/components/ui/dialog";
import { fmtBytes } from "@/lib/format";

type FileRow = Awaited<ReturnType<typeof listProductFilesAction>>[number];

export default function ProductFiles({ productId }: { productId: string }) {
  const t = useT();
  const inputRef = useRef<HTMLInputElement>(null);
  const [files, setFiles] = useState<FileRow[]>([]);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    listProductFilesAction(productId).then(setFiles);
  }, [productId]);

  async function upload(file: File) {
    setUploading(true);
    try {
      const form = new FormData();
      form.append("productId", productId);
      form.append("file", file);
      const res = await fetch("/api/resources", { method: "POST", body: form });
      const data = await res.json().catch(() => null);
      if (!res.ok) {
        toast.error(data?.error ?? t("studio.produk.uploadFailed"));
        return;
      }
      setFiles(data.files);
      toast.success(t("studio.produk.fileUploaded"));
    } catch {
      toast.error(t("studio.produk.uploadFailed"));
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  async function remove(id: string, filename: string) {
    const ok = await askConfirm({
      title: t("studio.produk.fileDeleteTitle"),
      body: filename,
      confirmLabel: t("common.delete"),
      danger: true,
    });
    if (!ok) return;
    const res = await deleteResourceFileAction(id);
    if ("error" in res) {
      toast.error(res.error);
      return;
    }
    setFiles((f) => f.filter((x) => x.id !== id));
    toast.success(t("studio.produk.fileDeleted"));
  }

  return (
    <div className="rounded-xl border border-yt-outline p-4">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-base font-medium">{t("studio.produk.filesTitle")}</h2>
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
          className="flex h-9 items-center gap-2 rounded-full bg-yt-chip px-4 text-sm hover:bg-yt-chip-hover disabled:opacity-50"
        >
          <Upload size={16} />
          {uploading ? t("studio.produk.uploading") : t("studio.produk.uploadFile")}
        </button>
        <input
          ref={inputRef}
          type="file"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) upload(f);
          }}
        />
      </div>

      {files.length === 0 ? (
        <p className="py-6 text-center text-sm text-yt-text2">{t("studio.produk.filesEmpty")}</p>
      ) : (
        <ul>
          {files.map((f) => (
            <li
              key={f.id}
              className="flex items-center gap-3 border-b border-yt-outline/60 py-2.5 last:border-b-0"
            >
              <span className="rounded-full bg-yt-chip px-2.5 py-1 text-xs">v{f.version}</span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm">{f.filename}</span>
                <span className="block text-xs text-yt-text2">{fmtBytes(f.size)}</span>
              </span>
              <button
                type="button"
                onClick={() => remove(f.id, f.filename)}
                aria-label={t("studio.users.deleteAria", { name: f.filename })}
                className="rounded-full p-2 text-red-500 hover:bg-yt-hover"
              >
                <Trash2 size={16} />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
