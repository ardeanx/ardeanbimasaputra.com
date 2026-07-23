import Link from "next/link";
import { Check, MessagesSquare, Pencil, ThumbsUp } from "lucide-react";
import type { Fmt } from "@/lib/format";

type T = (key: string, params?: Record<string, string | number>) => string;

export default function QnaSidebar({
  tags,
  activeTag,
  t,
  fmt,
}: {
  tags: { tag: string; count: number }[];
  activeTag?: string;
  t: T;
  fmt: Fmt;
}) {
  const steps = [
    { icon: <Pencil size={15} />, text: t("qna.how.ask") },
    { icon: <MessagesSquare size={15} />, text: t("qna.how.answer") },
    { icon: <ThumbsUp size={15} />, text: t("qna.how.vote") },
    { icon: <Check size={15} strokeWidth={3} />, text: t("qna.how.accept") },
  ];

  return (
    <aside className="hidden w-[300px] shrink-0 lg:block">
      <div className="sticky top-6 space-y-4">
        <div className="rounded-xl border border-yt-outline bg-yt-raised p-4">
          <h2 className="text-sm font-semibold text-yt-text">{t("qna.how.title")}</h2>
          <ul className="mt-3 space-y-3">
            {steps.map((s) => (
              <li key={s.text} className="flex items-start gap-2.5 text-sm leading-5 text-yt-text2">
                <span className="mt-0.5 shrink-0 text-yt-cta">{s.icon}</span>
                <span>{s.text}</span>
              </li>
            ))}
          </ul>
        </div>

        {tags.length > 0 && (
          <div className="rounded-xl border border-yt-outline bg-yt-raised p-4">
            <h2 className="text-sm font-semibold text-yt-text">{t("qna.popularTags")}</h2>
            <div className="mt-3 flex flex-wrap gap-1.5">
              {tags.slice(0, 18).map((tg) => (
                <Link
                  key={tg.tag}
                  href={`/qna?tag=${encodeURIComponent(tg.tag)}`}
                  className={`inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs transition-colors ${
                    activeTag === tg.tag
                      ? "bg-yt-cta/15 text-yt-cta"
                      : "bg-yt-chip text-yt-text2 hover:bg-yt-chip-hover hover:text-yt-text"
                  }`}
                >
                  <span>{tg.tag}</span>
                  <span className="text-yt-text2/60">{fmt.compact(tg.count)}</span>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </aside>
  );
}
