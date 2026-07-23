"use client";

import { useT } from "@/components/i18n/I18nProvider";
import ImageCropModal from "@/components/ui/ImageCropModal";
import { X } from "lucide-react";
import { useRef, useState } from "react";

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
}: {
  label: string;
  value: string | null;
  onChange: (url: string | null) => void;
  hint?: string;
  fit?: "contain" | "cover";
}) {
  const t = useT();
  const inputRef = useRef<HTMLInputElement>(null);
  const [progress, setProgress] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [drag, setDrag] = useState(false);
  const [pendingFile, setPendingFile] = useState<File | null>(null);

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
      else setError(safeErr(xhr.responseText, t("settings.uploadFailed")));
    };
    xhr.onerror = () => {
      setProgress(null);
      setError(t("settings.uploadFailed"));
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
      else setError(safeErr(xhr.responseText, t("settings.uploadFailed")));
    };
    xhr.onerror = () => {
      setProgress(null);
      setError(t("settings.uploadFailed"));
    };
    xhr.send(form);
  }

  function pick(files: FileList | null) {
    const f = files?.[0];
    if (!f) return;
    if (f.type.startsWith("image/")) {
      setPendingFile(f);
      return;
    }
    upload(f);
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
        className={`relative grid h-28 w-full cursor-pointer place-items-center overflow-hidden rounded-lg border border-dashed text-sm text-yt-text2 transition ${
          drag ? "border-yt-cta bg-yt-hover" : "border-yt-outline hover:bg-yt-hover"
        }`}
      >
        {value ? (
          <img
            src={value}
            alt=""
            className={`h-full w-full p-2 ${fit === "cover" ? "object-cover" : "object-contain"}`}
          />
        ) : (
          <span className="px-3 text-center text-xs">{t("settings.dropzoneHint")}</span>
        )}
        {value && progress === null && (
          <button
            type="button"
            aria-label={t("settings.removeLabel", { label })}
            onClick={(e) => {
              e.stopPropagation();
              onChange(null);
            }}
            className="absolute top-1.5 right-1.5 rounded-full bg-black/60 p-1 text-white transition hover:bg-black/80"
          >
            <X size={14} />
          </button>
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
        onChange={(e) => pick(e.target.files)}
      />
      {error && <p className="mt-1 text-sm text-red-500">{error}</p>}
      <ImageCropModal
        open={Boolean(pendingFile)}
        file={pendingFile}
        aspectRatio={fit === "cover" ? 16 / 9 : 1}
        onClose={() => setPendingFile(null)}
        onSave={(blob) => {
          setPendingFile(null);
          uploadBlob(blob);
        }}
      />
    </div>
  );
}
