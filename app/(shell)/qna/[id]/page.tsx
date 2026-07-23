import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import AnswerComposer from "@/components/qna/AnswerComposer";
import AnswerList from "@/components/qna/AnswerList";
import AuthorByline from "@/components/qna/AuthorByline";
import QnaBody from "@/components/qna/QnaBody";
import QnaComments from "@/components/qna/QnaComments";
import QnaVote from "@/components/qna/QnaVote";
import { SaveButton, ShareButton } from "@/components/qna/QuestionActions";
import JsonLd from "@/components/seo/JsonLd";
import { getFmt } from "@/lib/format-server";
import { getT } from "@/lib/i18n";
import { qaPage } from "@/lib/jsonld";
import { getQuestion, listAnswers, listQnaComments } from "@/lib/qna";
import { baseUrl } from "@/lib/seo";
import { getSession, isAdminUser } from "@/lib/session";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const t = await getT();
  const q = await getQuestion(id);
  if (!q) return { title: t("qna.title") };
  const description = q.body.slice(0, 160);
  const url = `/qna/${id}`;
  return {
    title: q.title,
    description,
    alternates: { canonical: url },
    openGraph: { title: q.title, description, url, type: "article" },
  };
}

export default async function QuestionDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const t = await getT();
  const fmt = await getFmt();
  const session = await getSession();
  const viewerId = session?.user.id ?? null;

  const question = await getQuestion(id, viewerId);
  if (!question) notFound();

  const comments = await listQnaComments("question", question.id);
  const answers = await listAnswers(question.id);
  const base = baseUrl();
  const isLoggedIn = !!session;
  const canAccept =
    isLoggedIn &&
    (question.author.id === viewerId ||
      (!!session && isAdminUser(session.user as { role?: string | null })));

  return (
    <div className="mx-auto max-w-[1080px] px-4 pb-16 pt-6 sm:px-6">
      <JsonLd data={qaPage(question, answers, base)} />
      <Link
        href="/qna"
        className="inline-flex items-center gap-1 text-sm text-yt-text2 hover:text-yt-text"
      >
        <ArrowLeft size={16} />
        {t("qna.title")}
      </Link>

      <div className="mt-4">
        <h1 className="text-2xl font-bold leading-snug text-yt-text sm:text-3xl">
          {question.title}
        </h1>
        <div className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-yt-text2">
          <span>
            {t("qna.asked")} {fmt.ago(question.createdAt)}
          </span>
          <span>·</span>
          <span>
            {fmt.compact(question.viewCount)} {t("qna.stats.views")}
          </span>
          {question.closed && (
            <span className="rounded-md bg-yt-chip px-2 py-0.5 text-yt-text2">
              {t("qna.closed")}
            </span>
          )}
        </div>
      </div>

      <div className="mt-5 flex gap-4 border-t border-yt-outline pt-6">
        <div className="flex shrink-0 flex-col items-center gap-3">
          <QnaVote
            targetType="question"
            targetId={question.id}
            score={question.score}
            myVote={question.myVote}
            canVote={isLoggedIn}
          />
          <SaveButton questionId={question.id} />
        </div>
        <div className="min-w-0 flex-1">
          <QnaBody body={question.body} ogCard={question.ogCard} />

          {question.tags.length > 0 && (
            <div className="mt-4 flex flex-wrap gap-1.5">
              {question.tags.map((tag) => (
                <Link
                  key={tag}
                  href={`/qna?tag=${encodeURIComponent(tag)}`}
                  className="rounded-md bg-yt-chip px-2.5 py-1 text-xs text-yt-text2 transition-colors hover:bg-yt-chip-hover hover:text-yt-text"
                >
                  {tag}
                </Link>
              ))}
            </div>
          )}

          <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
            <ShareButton />
            <div className="rounded-xl border border-yt-cta/30 bg-yt-cta/[0.06] px-3.5 py-2">
              <p className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-yt-cta">
                {t("qna.askedBy")}
              </p>
              <AuthorByline
                author={question.author}
                ago={fmt.ago(question.createdAt)}
                avatarSize={32}
              />
            </div>
          </div>

          <QnaComments
            targetType="question"
            targetId={question.id}
            comments={comments}
            isLoggedIn={isLoggedIn}
          />
        </div>
      </div>

      <AnswerList
        questionId={question.id}
        viewerId={viewerId}
        canVote={isLoggedIn}
        canAccept={canAccept}
        isLoggedIn={isLoggedIn}
      />

      <div className="mt-10 border-t border-yt-outline pt-8">
        <AnswerComposer questionId={question.id} isLoggedIn={isLoggedIn} />
      </div>
    </div>
  );
}
