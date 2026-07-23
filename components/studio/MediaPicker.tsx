"use client";

import { useRef, useState } from "react";
import { useT } from "@/components/i18n/I18nProvider";

function safeErr(body: string, fallback: string): string {
  try {
    return JSON.parse(body).error ?? fallback;
  } catch {
    return fallback;
  }
}

export default function MediaPicker({
  value,
  onChange,
}: {
  value?: string | null;
  onChange: (url: string) => void;
}) {
  const t = useT();
  const inputRef = useRef<HTMLInputElement>(null);
  const [progress, setProgress] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [drag, setDrag] = useState(false);

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
      else setError(safeErr(xhr.responseText, t("editor.uploadFailed")));
    };
    xhr.onerror = () => {
      setProgress(null);
      setError(t("editor.uploadFailed"));
    };
    xhr.send(form);
  }

  function pick(files: FileList | null) {
    const f = files?.[0];
    if (f) upload(f);
  }

  return (
    <div>
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
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
        className={`relative grid aspect-video w-full place-items-center overflow-hidden rounded-lg border border-dashed text-sm text-yt-text2 transition ${
          drag ? "border-yt-cta bg-yt-hover" : "border-yt-outline hover:bg-yt-hover"
        }`}
      >
        {value ? (
          <img src={value} alt="" className="h-full w-full object-cover" />
        ) : (
          <span>{t("editor.dropImage")}</span>
        )}
        {progress !== null && (
          <div className="absolute inset-0 grid place-items-center bg-yt-base/70">
            <span className="text-sm font-medium text-yt-text">{progress}%</span>
          </div>
        )}
      </button>
      <input
        ref={inputRef}
        type="file"
        accept="image/png,image/jpeg,image/webp,image/gif"
        hidden
        onChange={(e) => pick(e.target.files)}
      />
      {error && <p className="mt-1 text-sm text-red-500">{error}</p>}
    </div>
  );
}
