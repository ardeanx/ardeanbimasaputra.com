"use client";

import { useState } from "react";
import { KIND_LABEL_KEYS } from "@/components/cards/productKinds";
import ZoomImg from "@/components/content/ZoomImg";
import { useT } from "@/components/i18n/I18nProvider";

export default function ProductGallery({
  images,
  kind,
  title,
}: {
  images: string[];
  kind: string;
  title: string;
}) {
  const t = useT();
  const [active, setActive] = useState(0);
  const main = images[active] ?? images[0];

  return (
    <div>
      <div className="relative aspect-video overflow-hidden rounded-xl bg-yt-hover">
        {main && <ZoomImg src={main} alt={title} className="h-full w-full object-cover" />}
        <span className="absolute left-3 top-3 rounded bg-black/80 px-2 py-1 text-xs font-medium text-white">
          {t(KIND_LABEL_KEYS[kind] ?? "") || kind}
        </span>
      </div>
      {images.length > 1 && (
        <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
          {images.map((src, i) => (
            <button
              key={src}
              type="button"
              onClick={() => setActive(i)}
              aria-label={t("aria.imageN", { n: i + 1 })}
              className={`relative aspect-video w-24 shrink-0 overflow-hidden rounded-lg border-2 ${
                i === active ? "border-yt-cta" : "border-transparent"
              }`}
            >
              <img src={src} alt={title} className="h-full w-full object-cover" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
