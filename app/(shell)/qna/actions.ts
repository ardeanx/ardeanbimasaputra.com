"use server";

import { fetchOgCardAction } from "@/app/(shell)/og-actions";
import { getSession } from "@/lib/session";
import {
  acceptAnswer,
  applyQnaVote,
  insertAnswer,
  insertQnaComment,
  insertQuestion,
} from "@/lib/qna";

type Ok<T> = { ok: true } & T;
type Err = { error: string };

function firstUrl(body: string): string | null {
  const m = body.match(/https?:\/\/[^\s"'<>)\\]+/i);
  return m ? m[0] : null;
}

async function ogCardFor(body: string) {
  const url = firstUrl(body);
  return url ? await fetchOgCardAction(url) : null;
}

export async function createQuestionAction(input: {
  title: string;
  body: string;
  tags: string[];
}): Promise<Ok<{ id: string }> | Err> {
  const session = await getSession();
  if (!session) return { error: "qna.err.login" };
  const title = input.title.trim();
  const body = input.body.trim();
  if (!title) return { error: "qna.err.title" };
  if (!body) return { error: "qna.err.body" };
  const tags = input.tags
    .map((t) => t.trim().toLowerCase())
    .filter(Boolean)
    .slice(0, 5);
  const id = await insertQuestion({
    authorId: session.user.id,
    title,
    body,
    tags,
    ogCard: await ogCardFor(body),
  });
  return { ok: true, id };
}

export async function createAnswerAction(input: {
  questionId: string;
  body: string;
}): Promise<Ok<{ id: string }> | Err> {
  const session = await getSession();
  if (!session) return { error: "qna.err.login" };
  const body = input.body.trim();
  if (!body) return { error: "qna.err.body" };
  const id = await insertAnswer({
    questionId: input.questionId,
    authorId: session.user.id,
    body,
    ogCard: await ogCardFor(body),
  });
  return { ok: true, id };
}

export async function createQnaCommentAction(input: {
  targetType: "question" | "answer";
  targetId: string;
  body: string;
}): Promise<Ok<{ id: string }> | Err> {
  const session = await getSession();
  if (!session) return { error: "qna.err.login" };
  const body = input.body.trim();
  if (!body) return { error: "qna.err.body" };
  const id = await insertQnaComment({
    targetType: input.targetType,
    targetId: input.targetId,
    authorId: session.user.id,
    body,
  });
  return { ok: true, id };
}

export async function voteQnaAction(
  targetType: "question" | "answer",
  targetId: string,
  value: 1 | -1,
): Promise<Ok<{ score: number }> | Err> {
  const session = await getSession();
  if (!session) return { error: "qna.err.login" };
  const score = await applyQnaVote(session.user.id, targetType, targetId, value);
  return { ok: true, score };
}

export async function acceptAnswerAction(
  questionId: string,
  answerId: string,
): Promise<{ ok: true } | Err> {
  const session = await getSession();
  if (!session) return { error: "qna.err.login" };
  try {
    await acceptAnswer(session.user.id, questionId, answerId);
  } catch {
    return { error: "qna.err.forbidden" };
  }
  return { ok: true };
}
