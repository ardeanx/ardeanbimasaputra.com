"use client";

import Image from "next/image";
import Link from "next/link";
import { useRef, useState } from "react";
import { dominantColor } from "@/components/cards/dominant";

export default function RelatedCard({
  href,
  thumbnail,
  title,
  authorName,
  metaLine,
}: {
  href: string;
  thumbnail: string | null;
  title: string;
  authorName: string;
  metaLine: string;
}) {
  const ref = useRef<HTMLAnchorElement>(null);
  const done = useRef(false);
  const [glow, setGlow] = useState<string | null>(null);

  function onEnter() {
    if (done.current) return;
    const img = ref.current?.querySelector("img");
    if (!img || !img.complete) return;
    done.current = true;
    setGlow(dominantColor(img));
  }

  return (
    <Link
      ref={ref}
      href={href}
      onPointerEnter={onEnter}
      className="group relative isolate flex gap-2"
    >
      <span
        aria-hidden
        style={glow ? { backgroundColor: glow } : undefined}
        className="absolute -inset-1.5 -z-10 rounded-xl bg-yt-hover opacity-0 transition-opacity duration-300 group-hover:opacity-100 group-hover:delay-100"
      />
      <span className="relative block aspect-video w-[168px] shrink-0 overflow-hidden rounded-lg bg-yt-hover">
        {thumbnail && <Image src={thumbnail} alt="" fill sizes="168px" className="object-cover" />}
      </span>
      <span className="min-w-0">
        <span className="line-clamp-2 text-sm font-medium leading-5">{title}</span>
        <span className="mt-1 block text-xs text-yt-text2">{authorName}</span>
        <span className="block text-xs text-yt-text2">{metaLine}</span>
      </span>
    </Link>
  );
}
