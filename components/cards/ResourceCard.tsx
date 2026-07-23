import { FolderGit2 } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { CheckBadgeIcon } from "@/components/shell/icons";
import { fmtBytes } from "@/lib/format";
import { getFmt } from "@/lib/format-server";
import { getT } from "@/lib/i18n";

export type ResourceCardData = {
  id: string;
  slug: string;
  title: string;
  thumbnail: string | null;
  viewCount: number;
  publishedAt: Date | null;
  repoUrl: string | null;
  fileCount: number;
  totalSize: number;
  author: {
    name: string;
    username: string | null;
    image: string | null;
    role: string | null;
    verified?: boolean | null;
  };
};

export default async function ResourceCard({ post }: { post: ResourceCardData }) {
  const [t, fmt] = await Promise.all([getT(), getFmt()]);
  return (
    <div className="group relative isolate flex flex-col gap-3">
      <span
        aria-hidden
        className="absolute -inset-2 -z-10 rounded-2xl bg-yt-hover opacity-0 transition-opacity duration-300 group-hover:opacity-100 group-hover:delay-100"
      />
      <Link
        href={`/${post.slug}`}
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
      </Link>
      <div className="flex gap-3">
        <Link href={`/@${post.author.username}`} aria-label={post.author.name} className="shrink-0">
          <img src={post.author.image ?? ""} alt="" className="h-9 w-9 rounded-full bg-yt-hover" />
        </Link>
        <div className="min-w-0 flex-1">
          <Link href={`/${post.slug}`}>
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
            {fmt.views(post.viewCount, "RESOURCE")} • {fmt.ago(post.publishedAt)}
          </p>
          <p className="flex items-center gap-1.5 text-sm text-yt-text2">
            {t("resource.files", { n: post.fileCount })} · {fmtBytes(post.totalSize)}
            {post.repoUrl && <FolderGit2 size={14} />}
          </p>
        </div>
      </div>
    </div>
  );
}
