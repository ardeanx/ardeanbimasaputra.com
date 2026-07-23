"use client";

import { useState } from "react";
import { dominantColor } from "@/components/cards/dominant";
import { useT } from "@/components/i18n/I18nProvider";

export default function DescriptionBox({
  meta,
  thumbnail,
  children,
}: {
  meta: string;
  thumbnail?: string | null;
  children: React.ReactNode;
}) {
  const t = useT();
  const [open, setOpen] = useState(false);
  const [hovered, setHovered] = useState(false);
  const [glow, setGlow] = useState<string | null>(null);

  function onEnter() {
    setHovered(true);
    if (glow || !thumbnail) return;
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => setGlow(dominantColor(img));
    img.src = thumbnail;
  }

  return (
    <div
      onPointerEnter={onEnter}
      onPointerLeave={() => setHovered(false)}
      style={hovered && glow ? { backgroundColor: glow } : undefined}
      className="mt-4 rounded-xl bg-yt-chip p-3 text-sm transition-colors duration-300"
    >
      <p className="font-medium">{meta}</p>
      <div className={open ? "mt-2" : "mt-2 line-clamp-3"}>{children}</div>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="mt-1 font-medium text-yt-text"
      >
        {open ? t("watch.showLess") : t("watch.showMore")}
      </button>
    </div>
  );
}
