"use client";

import { Camera } from "lucide-react";
import { useRef, useState } from "react";
import { toast } from "sonner";

function safeErr(body: string): string {
  try {
    return JSON.parse(body).error ?? "Gagal mengunggah.";
  } catch {
    return "Gagal mengunggah.";
  }
}

export default function ImageOverlayPicker({
  value,
  shape,
  onChange,
  className = "",
}: {
  value: string | null;
  shape: "circle" | "banner";
  onChange: (url: string) => void;
  className?: string;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [progress, setProgress] = useState<number | null>(null);

  function upload(file: File) {
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
      else toast.error(safeErr(xhr.responseText));
    };
    xhr.onerror = () => {
      setProgress(null);
      toast.error("Gagal mengunggah.");
    };
    xhr.send(form);
  }

  const busy = progress !== null;
  const rounded = shape === "circle" ? "rounded-full" : "rounded-2xl";

  return (
    <button
      type="button"
      onClick={() => inputRef.current?.click()}
      disabled={busy}
      aria-label={shape === "circle" ? "Ubah avatar" : "Ubah banner"}
      className={`group relative block overflow-hidden ${rounded} ${className}`}
    >
      {value ? (
        <img src={value} alt="" className="h-full w-full object-cover" />
      ) : (
        <span className="block h-full w-full" />
      )}
      <span className="absolute inset-0 flex flex-col items-center justify-center gap-1 bg-black/45 text-white opacity-0 transition group-hover:opacity-100">
        <Camera className="h-5 w-5" />
        {shape === "banner" && <span className="text-xs font-medium">Ubah</span>}
      </span>
      {busy && (
        <span className="absolute inset-0 flex items-center justify-center bg-black/55 text-sm font-medium text-white">
          {progress}%
        </span>
      )}
      <input
        ref={inputRef}
        type="file"
        accept="image/png,image/jpeg,image/webp,image/gif"
        hidden
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) upload(f);
          e.target.value = "";
        }}
      />
    </button>
  );
}
