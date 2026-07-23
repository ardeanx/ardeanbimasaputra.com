import Link from "next/link";
import AuthorByline from "./AuthorByline";
import type { Fmt } from "@/lib/format";
import type { QuestionRow } from "@/lib/qna";

type T = (key: string, params?: Record<string, string | number>) => string;

function Stat({ value, label, solved }: { value: string; label: string; solved?: boolean }) {
  return (
    <div
      className={`flex w-[68px] shrink-0 flex-col items-center rounded-lg border px-2 py-1.5 text-center ${
        solved ? "border-green-500/40 bg-green-500/10" : "border-yt-outline"
      }`}
    >
      <span
        className={`text-base font-semibold tabular-nums ${
          solved ? "text-green-500" : "text-yt-text"
        }`}
      >
        {value}
      </span>
      <span className={`text-[11px] leading-tight ${solved ? "text-green-500" : "text-yt-text2"}`}>
        {label}
      </span>
    </div>
  );
}

export default function QuestionCard({ q, t, fmt }: { q: QuestionRow; t: T; fmt: Fmt }) {
  const solved = !!q.acceptedAnswerId;
  return (
    <article className="group flex gap-4 px-3 py-5 transition-colors hover:bg-yt-hover">
      <div className="hidden shrink-0 flex-col gap-1.5 sm:flex">
        <Stat value={fmt.compact(q.score)} label={t("qna.stats.votes")} />
        <Stat value={fmt.compact(q.answerCount)} label={t("qna.stats.answers")} solved={solved} />
        <Stat value={fmt.compact(q.viewCount)} label={t("qna.stats.views")} />
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-start gap-2">
          <Link
            href={`/qna/${q.id}`}
            className="line-clamp-2 text-base font-semibold text-yt-text group-hover:text-yt-cta sm:text-lg"
          >
            {q.title}
          </Link>
          {q.closed && (
            <span className="mt-1 shrink-0 rounded-md bg-yt-chip px-2 py-0.5 text-xs text-yt-text2">
              {t("qna.closed")}
            </span>
          )}
        </div>
        <p className="mt-1.5 line-clamp-2 text-sm leading-6 text-yt-text2">{q.body}</p>

        {q.tags.length > 0 && (
          <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
            {q.tags.map((tag) => (
              <Link
                key={tag}
                href={`/qna?tag=${encodeURIComponent(tag)}`}
                className="rounded-md bg-yt-chip px-2 py-0.5 text-xs text-yt-text2 transition-colors hover:bg-yt-chip-hover hover:text-yt-text"
              >
                {tag}
              </Link>
            ))}
          </div>
        )}

        <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
          <AuthorByline author={q.author} ago={fmt.ago(q.createdAt)} avatarSize={20} />
          <div className="flex items-center gap-3 text-xs text-yt-text2 sm:hidden">
            <span>
              {fmt.compact(q.score)} {t("qna.stats.votes")}
            </span>
            <span className={solved ? "text-green-500" : ""}>
              {fmt.compact(q.answerCount)} {t("qna.stats.answers")}
            </span>
          </div>
        </div>
      </div>
    </article>
  );
}
