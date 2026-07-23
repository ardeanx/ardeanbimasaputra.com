import type { Metadata } from "next";
import Link from "next/link";
import { MessagesSquare, Plus, X } from "lucide-react";
import QnaSidebar from "@/components/qna/QnaSidebar";
import QuestionCard from "@/components/qna/QuestionCard";
import EmptyState from "@/components/ui/EmptyState";
import { getFmt } from "@/lib/format-server";
import { getT } from "@/lib/i18n";
import { listQuestions, listTags } from "@/lib/qna";
import { getSession } from "@/lib/session";

export const dynamic = "force-dynamic";

const SORTS = ["newest", "active", "votes", "unanswered"] as const;
type Sort = (typeof SORTS)[number];

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT();
  return { title: t("qna.title"), alternates: { canonical: "/qna" } };
}

export default async function QnaList({
  searchParams,
}: {
  searchParams: Promise<{ sort?: string; tag?: string; q?: string }>;
}) {
  const sp = await searchParams;
  const sort = (SORTS.includes(sp.sort as Sort) ? sp.sort : "newest") as Sort;
  const tag = sp.tag?.trim() || undefined;
  const q = sp.q?.trim() || undefined;

  const t = await getT();
  const fmt = await getFmt();
  const session = await getSession();

  const [questions, tags] = await Promise.all([
    listQuestions({ sort, tag, q, viewerId: session?.user.id }),
    listTags(),
  ]);

  const qs = (extra: Record<string, string | undefined>) => {
    const p = new URLSearchParams();
    const merged = { sort, tag, q, ...extra };
    for (const [k, v] of Object.entries(merged)) if (v) p.set(k, v);
    const s = p.toString();
    return s ? `/qna?${s}` : "/qna";
  };

  return (
    <div className="mx-auto max-w-[1400px] px-4 pb-16 sm:px-6">
      <div className="flex flex-wrap items-start justify-between gap-4 pt-6">
        <div>
          <h1 className="text-2xl font-bold text-yt-text sm:text-3xl">{t("qna.title")}</h1>
          <p className="mt-1 text-sm text-yt-text2">
            {t("qna.questionsCount", { count: fmt.compact(questions.length) })}
          </p>
        </div>
        <Link
          href="/qna/ask"
          className="inline-flex h-10 shrink-0 items-center gap-1.5 rounded-full bg-yt-cta px-5 text-sm font-medium text-yt-cta-text hover:opacity-90"
        >
          <Plus size={18} />
          {t("qna.ask")}
        </Link>
      </div>

      <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-1 self-start overflow-x-auto rounded-full bg-yt-chip p-1">
          {SORTS.map((s) => (
            <Link
              key={s}
              href={qs({ sort: s === "newest" ? undefined : s })}
              className={`shrink-0 rounded-full px-3.5 py-1.5 text-sm font-medium transition-colors ${
                sort === s
                  ? "bg-yt-menu text-yt-text shadow-sm"
                  : "text-yt-text2 hover:text-yt-text"
              }`}
            >
              {t(`qna.sort.${s}`)}
            </Link>
          ))}
        </div>

        <form action="/qna" className="sm:w-72">
          {sort !== "newest" && <input type="hidden" name="sort" value={sort} />}
          {tag && <input type="hidden" name="tag" value={tag} />}
          <input
            name="q"
            defaultValue={q ?? ""}
            placeholder={t("qna.searchPlaceholder")}
            className="w-full rounded-full border border-yt-searchborder bg-yt-base px-4 py-2 text-sm text-yt-text outline-none focus:border-yt-text placeholder:text-yt-text2"
          />
        </form>
      </div>

      {tag && (
        <div className="mt-4 flex items-center gap-2 text-sm text-yt-text2">
          <span>{t("qna.taggedWith")}</span>
          <span className="inline-flex items-center gap-1.5 rounded-md bg-yt-cta/15 px-2 py-0.5 text-xs font-medium text-yt-cta">
            {tag}
            <Link
              href={qs({ tag: undefined })}
              aria-label={t("qna.allTags")}
              className="hover:text-yt-text"
            >
              <X size={13} />
            </Link>
          </span>
        </div>
      )}

      <div className="mt-5 flex gap-8">
        <div className="min-w-0 flex-1">
          {questions.length === 0 ? (
            <EmptyState
              className="mt-8"
              icon={<MessagesSquare />}
              title={t("qna.noQuestions")}
              description={t("qna.noQuestionsHint")}
              action={{ label: t("qna.ask"), href: "/qna/ask" }}
            />
          ) : (
            <div className="-mx-3 divide-y divide-yt-outline border-t border-yt-outline">
              {questions.map((qq) => (
                <QuestionCard key={qq.id} q={qq} t={t} fmt={fmt} />
              ))}
            </div>
          )}
        </div>
        <QnaSidebar tags={tags} activeTag={tag} t={t} fmt={fmt} />
      </div>
    </div>
  );
}
