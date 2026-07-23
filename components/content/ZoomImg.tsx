"use client";

import { type CSSProperties, useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { useT } from "@/components/i18n/I18nProvider";

type Zoom = { src: string; alt: string };

let pushZoom: ((z: Zoom) => void) | null = null;

export function openZoom(src?: string | null, alt = ""): void {
  if (!src) return;
  pushZoom?.({ src, alt });
}

export default function ZoomImg({
  src,
  alt = "",
  className,
  style,
}: {
  src?: string | null;
  alt?: string;
  className?: string;
  style?: CSSProperties;
}) {
  if (!src) return null;
  return (
    <img
      src={src}
      alt={alt}
      style={style}
      onClick={() => openZoom(src, alt)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          openZoom(src, alt);
        }
      }}
      className={`${className ?? ""} cursor-zoom-in`}
    />
  );
}

export function ImageZoomHost() {
  const t = useT();
  const [zoom, setZoom] = useState<Zoom | null>(null);

  useEffect(() => {
    pushZoom = setZoom;
    return () => {
      pushZoom = null;
    };
  }, []);

  useEffect(() => {
    if (!zoom) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setZoom(null);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [zoom]);

  if (!zoom || typeof document === "undefined") return null;

  return createPortal(
    <button
      type="button"
      aria-label={t("aria.close")}
      onClick={() => setZoom(null)}
      className="fixed inset-0 z-[140] grid cursor-zoom-out place-items-center bg-black/90 p-4"
    >
      <img
        src={zoom.src}
        alt={zoom.alt}
        className="max-h-full max-w-full rounded-lg object-contain"
      />
    </button>,
    document.body,
  );
}
