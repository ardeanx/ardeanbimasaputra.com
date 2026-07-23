import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import QuestionComposer from "@/components/qna/QuestionComposer";
import { getT } from "@/lib/i18n";
import { getSession } from "@/lib/session";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT();
  return { title: t("qna.ask") };
}

export default async function AskPage() {
  const t = await getT();
  const session = await getSession();

  const tips = [t("qna.how.ask"), t("qna.how.answer"), t("qna.how.vote"), t("qna.how.accept")];

  return (
    <div className="mx-auto max-w-[1000px] px-4 pb-16 pt-6 sm:px-6">
      <Link
        href="/qna"
        className="inline-flex items-center gap-1 text-sm text-yt-text2 hover:text-yt-text"
      >
        <ArrowLeft size={16} />
        {t("qna.title")}
      </Link>
      <h1 className="mt-3 text-2xl font-bold text-yt-text sm:text-3xl">{t("qna.ask.heading")}</h1>

      {session ? (
        <div className="mt-6 flex flex-col gap-6 lg:flex-row">
          <div className="min-w-0 flex-1">
            <QuestionComposer isLoggedIn={true} />
          </div>
          <aside className="lg:w-[280px] lg:shrink-0">
            <div className="sticky top-6 rounded-xl border border-yt-outline bg-yt-raised p-4">
              <h2 className="text-sm font-semibold text-yt-text">{t("qna.how.title")}</h2>
              <ol className="mt-3 space-y-3">
                {tips.map((tip, i) => (
                  <li key={tip} className="flex gap-2.5 text-sm leading-5 text-yt-text2">
                    <span className="grid h-5 w-5 shrink-0 place-items-center rounded-full bg-yt-cta/15 text-[11px] font-semibold text-yt-cta">
                      {i + 1}
                    </span>
                    <span>{tip}</span>
                  </li>
                ))}
              </ol>
            </div>
          </aside>
        </div>
      ) : (
        <div className="mt-6 rounded-xl border border-yt-outline bg-yt-raised p-8 text-center">
          <p className="text-sm text-yt-text2">{t("qna.ask.signInPrompt")}</p>
          <Link
            href="/?signin=1"
            className="mt-4 inline-flex h-10 items-center rounded-full bg-yt-cta px-5 text-sm font-medium text-yt-cta-text hover:opacity-90"
          >
            {t("qna.signIn")}
          </Link>
        </div>
      )}
    </div>
  );
}
