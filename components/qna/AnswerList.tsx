import AnswersSection from "@/components/qna/AnswersSection";
import { listAnswers, listQnaComments } from "@/lib/qna";
import type { QnaCommentRow } from "@/lib/qna";

export default async function AnswerList({
  questionId,
  viewerId,
  canVote,
  canAccept,
  isLoggedIn,
}: {
  questionId: string;
  viewerId: string | null;
  canVote: boolean;
  canAccept: boolean;
  isLoggedIn: boolean;
}) {
  const answers = await listAnswers(questionId, viewerId);
  const commentLists = await Promise.all(answers.map((a) => listQnaComments("answer", a.id)));
  const commentsByAnswer: Record<string, QnaCommentRow[]> = {};
  answers.forEach((a, i) => {
    commentsByAnswer[a.id] = commentLists[i];
  });

  return (
    <AnswersSection
      questionId={questionId}
      answers={answers}
      commentsByAnswer={commentsByAnswer}
      canVote={canVote}
      canAccept={canAccept}
      isLoggedIn={isLoggedIn}
    />
  );
}
