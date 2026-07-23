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

type Box = { boxW: number; boxH: number; cx: number; cy: number };

function getBox(
  naturalWidth: number,
  naturalHeight: number,
  aspectRatio: number,
  zoom: number,
  panX: number,
  panY: number,
): Box {
  const imgAspect = naturalWidth / naturalHeight;
  let baseW: number;
  let baseH: number;
  if (imgAspect >= aspectRatio) {
    baseH = naturalHeight;
    baseW = baseH * aspectRatio;
  } else {
    baseW = naturalWidth;
    baseH = baseW / aspectRatio;
  }
  const z = Math.max(zoom, 1);
  const boxW = Math.max(1, baseW / z);
  const boxH = Math.max(1, baseH / z);
  const minCx = boxW / 2;
  const maxCx = Math.max(minCx, naturalWidth - boxW / 2);
  const minCy = boxH / 2;
  const maxCy = Math.max(minCy, naturalHeight - boxH / 2);
  const tx = (panX + 1) / 2;
  const ty = (panY + 1) / 2;
  const cx = minCx + tx * (maxCx - minCx);
  const cy = minCy + ty * (maxCy - minCy);
  return { boxW, boxH, cx, cy };
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
  const [viewportW, setViewportW] = useState(0);
  const previewRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = previewRef.current;
    if (!el) return;
    const update = () => setViewportW(el.clientWidth);
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, [open]);

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

  const box =
    image && image.naturalWidth
      ? getBox(image.naturalWidth, image.naturalHeight, aspectRatio, zoom, panX, panY)
      : null;

  async function save() {
    if (!image || !file || !box) return;
    setSaving(true);
    setError(null);

    try {
      const width = 1600;
      const height = Math.max(1, Math.round(width / aspectRatio));
      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;

      const ctx = canvas.getContext("2d");
      if (!ctx) {
        setError("Gagal membuat canvas crop.");
        return;
      }

      const outScale = width / box.boxW;
      ctx.save();
      ctx.translate(width / 2, height / 2);
      ctx.rotate((rotation * Math.PI) / 180);
      ctx.scale(outScale, outScale);
      ctx.translate(-box.cx, -box.cy);
      ctx.drawImage(image, 0, 0);
      ctx.restore();

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

  const viewportH = viewportW > 0 ? viewportW / aspectRatio : 0;
  const previewTransform =
    box && viewportW > 0
      ? `translate(${viewportW / 2}px, ${viewportH / 2}px) rotate(${rotation}deg) scale(${viewportW / box.boxW}) translate(${-box.cx}px, ${-box.cy}px)`
      : undefined;

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
              {src && image && box && previewTransform && (
                <img
                  src={src}
                  alt="preview"
                  className="absolute left-0 top-0 max-h-none max-w-none select-none"
                  style={{
                    width: image.naturalWidth,
                    height: image.naturalHeight,
                    transform: previewTransform,
                    transformOrigin: "0 0",
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
