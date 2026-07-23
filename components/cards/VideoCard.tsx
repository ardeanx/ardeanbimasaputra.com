"use client";

import Image from "next/image";
import Link from "next/link";
import { useRef, useState } from "react";
import { useFmt, useT } from "@/components/i18n/I18nProvider";
import { CheckBadgeIcon } from "@/components/shell/icons";
import CardMenu from "./CardMenu";
import { dominantColor } from "./dominant";
import { cardHref } from "./href";

export type CardData = {
  id: string;
  slug: string;
  title: string;
  thumbnail: string | null;
  readTime: number | null;
  durationSec?: number | null;
  type?: "VIDEO" | "AUDIO" | "POST" | "RESOURCE";
  viewCount: number;
  publishedAt: Date | null;
  author: {
    name: string;
    username: string | null;
    image: string | null;
    role: string | null;
    verified?: boolean | null;
  };
};

function Badge({ post }: { post: CardData }) {
  const t = useT();
  let label: string | null = null;
  if (post.durationSec && post.durationSec > 0) {
    const m = Math.floor(post.durationSec / 60);
    const s = post.durationSec % 60;
    label = `${m}:${String(s).padStart(2, "0")}`;
  } else if (post.readTime) {
    label = t("card.minShort", { n: post.readTime });
  }
  if (!label) return null;
  return (
    <span className="absolute bottom-1 right-1 rounded bg-black/80 px-1 py-0.5 text-xs font-medium text-white">
      {label}
    </span>
  );
}

export default function VideoCard({ post }: { post: CardData }) {
  const fmt = useFmt();
  const ref = useRef<HTMLDivElement>(null);
  const done = useRef(false);
  const [glow, setGlow] = useState<string | null>(null);
  const href = cardHref(post);

  function onEnter() {
    if (done.current) return;
    const img = ref.current?.querySelector("img");
    if (!img || !img.complete) return;
    done.current = true;
    setGlow(dominantColor(img));
  }

  return (
    <div ref={ref} onPointerEnter={onEnter} className="group relative isolate flex flex-col gap-3">
      <span
        aria-hidden
        style={glow ? { backgroundColor: glow } : undefined}
        className="absolute -inset-2 -z-10 rounded-2xl bg-yt-hover opacity-0 transition-opacity duration-300 delay-0 group-hover:opacity-100 group-hover:delay-100"
      />

      <Link
        href={href}
        aria-label={post.title}
        className="relative block aspect-video overflow-hidden rounded-xl bg-yt-hover"
      >
        {post.thumbnail && (
          <Image
            src={post.thumbnail}
            alt=""
            fill
            sizes="(max-width: 792px) 100vw, 360px"
            className="object-cover"
          />
        )}
        <Badge post={post} />
      </Link>

      <div className="flex gap-3">
        <Link href={`/@${post.author.username}`} aria-label={post.author.name} className="shrink-0">
          <img src={post.author.image ?? ""} alt="" className="h-9 w-9 rounded-full bg-yt-hover" />
        </Link>
        <div className="min-w-0 flex-1">
          <Link href={href}>
            <h3 className="line-clamp-2 text-base font-medium leading-[22px]">{post.title}</h3>
          </Link>
          <Link
            href={`/@${post.author.username}`}
            className="mt-1 flex items-center gap-1 text-sm text-yt-text2 hover:text-yt-text"
          >
            {post.author.name}
            {(post.author.role === "admin" || post.author.verified) && <CheckBadgeIcon />}
          </Link>
          <p className="text-sm text-yt-text2">
            {fmt.views(post.viewCount, post.type)} •{" "}
            <span suppressHydrationWarning>{fmt.ago(post.publishedAt)}</span>
          </p>
        </div>
        <div className="shrink-0 self-start">
          <CardMenu url={href} postId={post.id} />
        </div>
      </div>
    </div>
  );
}
