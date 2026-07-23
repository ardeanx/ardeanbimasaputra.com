"use client";

import { useT } from "@/components/i18n/I18nProvider";
import ImageCropModal from "@/components/ui/ImageCropModal";
import { Crop, Pencil, X } from "lucide-react";
import { useRef, useState } from "react";
import { toast } from "sonner";

function safeErr(body: string, fallback: string): string {
  try {
    return JSON.parse(body).error ?? fallback;
  } catch {
    return fallback;
  }
}

export default function DropzoneField({
  label,
  value,
  onChange,
  hint,
  fit = "contain",
  aspectRatio,
  skipCropFor,
}: {
  label: string;
  value: string | null;
  onChange: (url: string | null) => void;
  hint?: string;
  fit?: "contain" | "cover";
  aspectRatio?: number;
  skipCropFor?: RegExp;
}) {
  const t = useT();
  const inputRef = useRef<HTMLInputElement>(null);
  const [progress, setProgress] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [drag, setDrag] = useState(false);
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const ratio = aspectRatio ?? (fit === "cover" ? 16 / 9 : 1);

  function upload(file: File) {
    setError(null);
    setProgress(0);
    const form = new FormData();
    form.append("file", file);
    const xhr = new XMLHttpRequest();
    xhr.open("POST", "/api/uploads");
    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable) setProgress(Math.round((e.loaded / e.total) * 100));
    };
    xhr.onload = () => {
      setProgress(null);
      if (xhr.status === 201) onChange(JSON.parse(xhr.responseText).url);
      else {
        const msg = safeErr(xhr.responseText, t("settings.uploadFailed"));
        setError(msg);
        toast.error(msg);
      }
    };
    xhr.onerror = () => {
      setProgress(null);
      const msg = t("settings.uploadFailed");
      setError(msg);
      toast.error(msg);
    };
    xhr.send(form);
  }

  function uploadBlob(blob: Blob) {
    setError(null);
    setProgress(0);
    const form = new FormData();
    form.append("file", blob, pendingFile?.name ?? "cropped-image");
    const xhr = new XMLHttpRequest();
    xhr.open("POST", "/api/uploads");
    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable) setProgress(Math.round((e.loaded / e.total) * 100));
    };
    xhr.onload = () => {
      setProgress(null);
      if (xhr.status === 201) onChange(JSON.parse(xhr.responseText).url);
      else {
        const msg = safeErr(xhr.responseText, t("settings.uploadFailed"));
        setError(msg);
        toast.error(msg);
      }
    };
    xhr.onerror = () => {
      setProgress(null);
      const msg = t("settings.uploadFailed");
      setError(msg);
      toast.error(msg);
    };
    xhr.send(form);
  }

  function pick(files: FileList | null) {
    const f = files?.[0];
    if (!f) return;
    if (f.type.startsWith("image/") && !skipCropFor?.test(f.type)) {
      setPendingFile(f);
      return;
    }
    upload(f);
  }

  async function recropExisting() {
    if (!value) return;
    try {
      const res = await fetch(value, { cache: "no-store" });
      const buf = await res.blob();
      const ext = value.split(".").pop()?.toLowerCase() ?? "png";
      const type =
        ext === "png"
          ? "image/png"
          : ext === "jpg" || ext === "jpeg"
            ? "image/jpeg"
            : ext === "webp"
              ? "image/webp"
              : ext === "gif"
                ? "image/gif"
                : "image/png";
      const file = new File([buf], `edit-${Date.now()}.${ext}`, { type });
      setPendingFile(file);
    } catch {
      setError(t("settings.uploadFailed"));
    }
  }

  return (
    <div className="py-3">
      <p className="mb-1.5 text-sm font-medium">{label}</p>
      <div
        role="button"
        tabIndex={0}
        aria-label={t("settings.uploadLabel", { label })}
        onClick={() => inputRef.current?.click()}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            inputRef.current?.click();
          }
        }}
        onDragOver={(e) => {
          e.preventDefault();
          setDrag(true);
        }}
        onDragLeave={() => setDrag(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDrag(false);
          pick(e.dataTransfer.files);
        }}
        className={`relative w-full cursor-pointer overflow-hidden rounded-lg border border-dashed text-sm text-yt-text2 transition ${
          drag ? "border-yt-cta bg-yt-hover" : "border-yt-outline hover:bg-yt-hover"
        }`}
        style={{ aspectRatio: String(ratio) }}
      >
        {value ? (
          <img
            src={value}
            alt=""
            className={`absolute inset-0 h-full w-full ${
              fit === "cover" ? "object-cover" : "object-contain p-2"
            }`}
          />
        ) : (
          <span className="absolute inset-0 grid place-items-center px-3 text-center text-xs">
            {t("settings.dropzoneHint")}
          </span>
        )}
        {value && progress === null && (
          <div className="absolute top-1.5 right-1.5 flex gap-1">
            <button
              type="button"
              aria-label={t("settings.recropLabel")}
              onClick={(e) => {
                e.stopPropagation();
                recropExisting();
              }}
              className="grid h-7 w-7 place-items-center rounded-full bg-black/60 text-white transition hover:bg-black/80"
            >
              <Crop size={13} />
            </button>
            <button
              type="button"
              aria-label={t("settings.removeLabel", { label })}
              onClick={(e) => {
                e.stopPropagation();
                onChange(null);
              }}
              className="grid h-7 w-7 place-items-center rounded-full bg-black/60 text-white transition hover:bg-black/80"
            >
              <X size={13} />
            </button>
          </div>
        )}
        {value && progress === null && (
          <span className="pointer-events-none absolute bottom-1.5 left-1.5 flex items-center gap-1 rounded-full bg-black/60 px-2 py-1 text-[10px] font-medium text-white opacity-90">
            <Pencil size={10} />
            {t("settings.editHint")}
          </span>
        )}
        {progress !== null && (
          <div className="absolute inset-0 grid place-items-center bg-yt-base/70">
            <span className="text-sm font-medium text-yt-text">{progress}%</span>
          </div>
        )}
      </div>
      {hint && <p className="mt-1 text-xs text-yt-text2">{hint}</p>}
      <input
        ref={inputRef}
        type="file"
        accept="image/png,image/jpeg,image/webp,image/gif,image/x-icon"
        hidden
        onChange={(e) => {
          pick(e.target.files);
          e.target.value = "";
        }}
      />
      {error && <p className="mt-1 text-sm text-red-500">{error}</p>}
      <ImageCropModal
        open={Boolean(pendingFile)}
        file={pendingFile}
        aspectRatio={ratio}
        onClose={() => setPendingFile(null)}
        onSave={(blob) => {
          setPendingFile(null);
          uploadBlob(blob);
        }}
      />
    </div>
  );
}
