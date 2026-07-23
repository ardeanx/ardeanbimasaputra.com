"use client";

import { Crop, RotateCw, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

type Props = {
  open: boolean;
  file: File | null;
  aspectRatio: number;
  onClose: () => void;
  onSave: (blob: Blob) => void;
};

function clamp(v: number, min: number, max: number) {
  return Math.min(max, Math.max(min, v));
}

function getCropRegion(
  image: HTMLImageElement,
  aspectRatio: number,
  zoom: number,
  panX: number,
  panY: number,
) {
  const naturalWidth = image.naturalWidth || image.width;
  const naturalHeight = image.naturalHeight || image.height;
  const imgAspect = naturalWidth / naturalHeight;

  let cropWidth = naturalWidth;
  let cropHeight = naturalHeight;

  if (imgAspect > aspectRatio) {
    cropHeight = naturalHeight;
    cropWidth = cropHeight * aspectRatio;
  } else {
    cropWidth = naturalWidth;
    cropHeight = cropWidth / aspectRatio;
  }

  const visibleWidth = Math.max(1, cropWidth / Math.max(zoom, 0.8));
  const visibleHeight = Math.max(1, cropHeight / Math.max(zoom, 0.8));
  const maxSX = Math.max(0, naturalWidth - visibleWidth);
  const maxSY = Math.max(0, naturalHeight - visibleHeight);

  const sx = clamp((naturalWidth - visibleWidth) / 2 + panX * maxSX * 0.8, 0, maxSX);
  const sy = clamp((naturalHeight - visibleHeight) / 2 + panY * maxSY * 0.8, 0, maxSY);

  return {
    sx,
    sy,
    sw: visibleWidth,
    sh: visibleHeight,
  };
}

export default function ImageCropModal({ open, file, aspectRatio, onClose, onSave }: Props) {
  const [src, setSrc] = useState<string | null>(null);
  const [image, setImage] = useState<HTMLImageElement | null>(null);
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [panX, setPanX] = useState(0);
  const [panY, setPanY] = useState(0);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const previewRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open || !file) return;

    const reader = new FileReader();
    reader.onload = () => {
      const value = typeof reader.result === "string" ? reader.result : null;
      setSrc(value);
    };
    reader.readAsDataURL(file);

    return () => {
      setSrc(null);
      setImage(null);
      setZoom(1);
      setRotation(0);
      setPanX(0);
      setPanY(0);
      setError(null);
    };
  }, [open, file]);

  useEffect(() => {
    if (!src) return;
    const img = new window.Image();
    img.onload = () => setImage(img);
    img.src = src;
  }, [src]);

  async function save() {
    if (!image || !file) return;
    setSaving(true);
    setError(null);

    try {
      const canvas = document.createElement("canvas");
      const width = 1600;
      const height = Math.max(1, Math.round(width / aspectRatio));
      canvas.width = width;
      canvas.height = height;

      const ctx = canvas.getContext("2d");
      if (!ctx) {
        setError("Gagal membuat canvas crop.");
        return;
      }

      const crop = getCropRegion(image, aspectRatio, zoom, panX, panY);
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, width, height);
      ctx.translate(width / 2, height / 2);
      ctx.rotate((rotation * Math.PI) / 180);
      ctx.drawImage(
        image,
        crop.sx,
        crop.sy,
        crop.sw,
        crop.sh,
        -width / 2,
        -height / 2,
        width,
        height,
      );
      ctx.resetTransform();

      const blob = await new Promise<Blob | null>((resolve) => {
        canvas.toBlob(resolve, file.type || "image/png", 0.92);
      });

      if (!blob) {
        setError("Gagal menghasilkan gambar hasil crop.");
        return;
      }

      onSave(blob);
      onClose();
    } catch {
      setError("Gagal menyimpan hasil crop.");
    } finally {
      setSaving(false);
    }
  }

  if (!open || !file) return null;

  return createPortal(
    <div className="fixed inset-0 z-[140] grid place-items-center bg-black/70 p-4">
      <div className="relative w-full max-w-3xl rounded-2xl bg-yt-raised shadow-2xl">
        <button
          type="button"
          onClick={onClose}
          className="absolute right-3 top-3 z-10 grid h-9 w-9 place-items-center rounded-full bg-black/50 text-white"
        >
          <X size={16} />
        </button>

        <div className="flex flex-col gap-4 p-4 md:flex-row md:p-6">
          <div className="flex-1">
            <div className="mb-3 flex items-center gap-2 text-sm font-medium text-yt-text">
              <Crop size={16} />
              Crop & Edit Gambar
            </div>
            <div
              ref={previewRef}
              className="relative overflow-hidden rounded-xl border border-yt-outline bg-yt-base"
              style={{ aspectRatio: `${aspectRatio}` }}
            >
              {src && image && (
                <img
                  src={src}
                  alt="preview"
                  className="absolute inset-0 h-full w-full object-cover"
                  style={{
                    transform: `translate(${panX * 60}px, ${panY * 60}px) scale(${zoom}) rotate(${rotation}deg)`,
                    transformOrigin: "center center",
                  }}
                />
              )}
              <div className="pointer-events-none absolute inset-0 border-2 border-dashed border-white/75" />
            </div>
          </div>

          <div className="w-full md:w-80">
            <label className="mb-3 block text-sm">
              <span className="mb-1 block text-yt-text2">Zoom</span>
              <input
                type="range"
                min={1}
                max={3}
                step={0.05}
                value={zoom}
                onChange={(e) => setZoom(Number(e.target.value))}
                className="w-full"
              />
            </label>
            <label className="mb-3 block text-sm">
              <span className="mb-1 block text-yt-text2">Rotate</span>
              <input
                type="range"
                min={-180}
                max={180}
                step={1}
                value={rotation}
                onChange={(e) => setRotation(Number(e.target.value))}
                className="w-full"
              />
            </label>
            <label className="mb-3 block text-sm">
              <span className="mb-1 block text-yt-text2">Geser horizontal</span>
              <input
                type="range"
                min={-1}
                max={1}
                step={0.01}
                value={panX}
                onChange={(e) => setPanX(Number(e.target.value))}
                className="w-full"
              />
            </label>
            <label className="mb-4 block text-sm">
              <span className="mb-1 block text-yt-text2">Geser vertikal</span>
              <input
                type="range"
                min={-1}
                max={1}
                step={0.01}
                value={panY}
                onChange={(e) => setPanY(Number(e.target.value))}
                className="w-full"
              />
            </label>

            {error && <p className="mb-3 text-sm text-red-500">{error}</p>}

            <div className="flex gap-2">
              <button
                type="button"
                onClick={onClose}
                className="h-10 flex-1 rounded-full border border-yt-outline text-sm font-medium"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={save}
                disabled={saving || !image}
                className="flex h-10 flex-1 items-center justify-center gap-2 rounded-full bg-yt-cta text-sm font-medium text-white disabled:opacity-50"
              >
                <RotateCw size={15} />
                {saving ? "Menyimpan..." : "Simpan Crop"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>,
    document.body,
  );
}
