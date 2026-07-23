"use client";

import Link from "next/link";
import { useFmt, useT } from "@/components/i18n/I18nProvider";

type Question = {
  id: string;
  title: string;
  authorName: string;
  score: number;
  answerCount: number;
  viewCount: number;
  closed: boolean;
  createdAt: string;
};

export default function QnaModeration({ questions }: { questions: Question[] }) {
  const t = useT();
  const fmt = useFmt();

  return (
    <div className="overflow-x-auto rounded-xl border border-yt-outline">
      <table className="w-full min-w-[720px] text-sm">
        <thead>
          <tr className="border-b border-yt-outline text-left text-xs text-yt-text2">
            <th className="p-3 font-medium">{t("studio.threads.colTitle")}</th>
            <th className="p-3 font-medium">{t("studio.threads.colAuthor")}</th>
            <th className="p-3 font-medium">{t("studio.threads.colScore")}</th>
            <th className="p-3 font-medium">{t("studio.content.colAnswers")}</th>
            <th className="p-3 font-medium">{t("studio.content.colViews")}</th>
            <th className="p-3 font-medium">{t("studio.threads.colCreated")}</th>
          </tr>
        </thead>
        <tbody>
          {questions.map((q) => (
            <tr
              key={q.id}
              className={`border-b border-yt-outline last:border-0 ${q.closed ? "opacity-50" : ""}`}
            >
              <td className="max-w-xs p-3">
                <div className="flex items-center gap-2">
                  <Link
                    href={`/qna/${q.id}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="line-clamp-1 font-medium hover:text-yt-cta"
                  >
                    {q.title}
                  </Link>
                  {q.closed && (
                    <span className="shrink-0 rounded-full bg-yt-chip px-2 py-0.5 text-xs text-yt-text2">
                      {t("studio.content.qnaClosed")}
                    </span>
                  )}
                </div>
              </td>
              <td className="p-3 text-yt-text2">{q.authorName || "—"}</td>
              <td className="p-3 tabular-nums">{q.score}</td>
              <td className="p-3 tabular-nums">{q.answerCount}</td>
              <td className="p-3 tabular-nums">{q.viewCount}</td>
              <td className="whitespace-nowrap p-3 text-yt-text2">{fmt.ago(q.createdAt)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
