import { and, desc, eq, ilike, sql } from "drizzle-orm";
import type { OgCardData } from "@/components/og/OgCard";
import { qnaAnswer, qnaComment, qnaQuestion, qnaVote, user } from "@/db/schema";
import { db } from "./db";
import { genId } from "./id";

function normalizeOgCard(card: OgCardData | null | undefined) {
  if (!card) return null;
  return {
    url: card.url,
    title: card.title ?? "",
    description: card.description ?? "",
    image: card.image ?? null,
    siteName: card.siteName ?? null,
  };
}

export type QnaAuthor = {
  id: string;
  name: string;
  image: string | null;
  verified: boolean;
};

export type QuestionRow = {
  id: string;
  author: QnaAuthor;
  title: string;
  body: string;
  ogCard: OgCardData | null;
  tags: string[];
  score: number;
  answerCount: number;
  viewCount: number;
  acceptedAnswerId: string | null;
  closed: boolean;
  createdAt: string;
  myVote: number;
};

export type AnswerRow = {
  id: string;
  questionId: string;
  author: QnaAuthor;
  body: string;
  ogCard: OgCardData | null;
  score: number;
  accepted: boolean;
  createdAt: string;
  myVote: number;
};

export type QnaCommentRow = {
  id: string;
  targetType: string;
  targetId: string;
  author: QnaAuthor;
  body: string;
  createdAt: string;
};

function author(
  id: string,
  name: string | null,
  image: string | null,
  verified: boolean | null,
): QnaAuthor {
  return { id, name: name ?? "", image, verified: verified ?? false };
}

function questionSelect(viewerId: string | null | undefined) {
  const vid = viewerId ?? "";
  return {
    id: qnaQuestion.id,
    authorId: qnaQuestion.authorId,
    userName: user.name,
    userImage: user.image,
    userVerified: user.verified,
    title: qnaQuestion.title,
    body: qnaQuestion.body,
    ogCard: qnaQuestion.ogCard,
    tags: qnaQuestion.tags,
    score: qnaQuestion.score,
    answerCount: qnaQuestion.answerCount,
    viewCount: qnaQuestion.viewCount,
    acceptedAnswerId: qnaQuestion.acceptedAnswerId,
    closed: qnaQuestion.closed,
    createdAt: qnaQuestion.createdAt,
    myVote: sql<number>`coalesce((select ${qnaVote.value} from ${qnaVote} where ${qnaVote.userId} = ${vid} and ${qnaVote.targetType} = 'question' and ${qnaVote.targetId} = ${qnaQuestion.id}), 0)`,
  };
}

type QuestionSel = {
  id: string;
  authorId: string;
  userName: string | null;
  userImage: string | null;
  userVerified: boolean | null;
  title: string;
  body: string;
  ogCard: OgCardData | null;
  tags: string[];
  score: number;
  answerCount: number;
  viewCount: number;
  acceptedAnswerId: string | null;
  closed: boolean;
  createdAt: Date;
  myVote: number;
};

function mapQuestion(r: QuestionSel): QuestionRow {
  return {
    id: r.id,
    author: author(r.authorId, r.userName, r.userImage, r.userVerified),
    title: r.title,
    body: r.body,
    ogCard: r.ogCard ?? null,
    tags: r.tags ?? [],
    score: r.score,
    answerCount: r.answerCount,
    viewCount: r.viewCount,
    acceptedAnswerId: r.acceptedAnswerId,
    closed: r.closed,
    createdAt: r.createdAt.toISOString(),
    myVote: Number(r.myVote),
  };
}

export async function listQuestions(opts: {
  sort?: "newest" | "active" | "votes" | "unanswered";
  tag?: string;
  q?: string;
  limit?: number;
  viewerId?: string | null;
}): Promise<QuestionRow[]> {
  const sort = opts.sort ?? "newest";
  const conds = [];
  if (opts.tag) conds.push(sql`${qnaQuestion.tags} @> ${JSON.stringify([opts.tag])}::jsonb`);
  if (opts.q) conds.push(ilike(qnaQuestion.title, `%${opts.q}%`));
  if (sort === "unanswered") conds.push(eq(qnaQuestion.answerCount, 0));

  const order =
    sort === "votes"
      ? desc(qnaQuestion.score)
      : sort === "active"
        ? sql`greatest(${qnaQuestion.createdAt}, coalesce((select max(${qnaAnswer.createdAt}) from ${qnaAnswer} where ${qnaAnswer.questionId} = ${qnaQuestion.id}), ${qnaQuestion.createdAt})) desc`
        : desc(qnaQuestion.createdAt);

  const rows = await db
    .select(questionSelect(opts.viewerId))
    .from(qnaQuestion)
    .leftJoin(user, eq(qnaQuestion.authorId, user.id))
    .where(conds.length ? and(...conds) : undefined)
    .orderBy(order)
    .limit(opts.limit ?? 50);

  return rows.map(mapQuestion);
}

export async function getQuestion(
  id: string,
  viewerId?: string | null,
): Promise<QuestionRow | null> {
  await db
    .update(qnaQuestion)
    .set({ viewCount: sql`${qnaQuestion.viewCount} + 1` })
    .where(eq(qnaQuestion.id, id));

  const [row] = await db
    .select(questionSelect(viewerId))
    .from(qnaQuestion)
    .leftJoin(user, eq(qnaQuestion.authorId, user.id))
    .where(eq(qnaQuestion.id, id))
    .limit(1);
  return row ? mapQuestion(row) : null;
}

export async function listAnswers(
  questionId: string,
  viewerId?: string | null,
): Promise<AnswerRow[]> {
  const vid = viewerId ?? "";
  const rows = await db
    .select({
      id: qnaAnswer.id,
      questionId: qnaAnswer.questionId,
      authorId: qnaAnswer.authorId,
      userName: user.name,
      userImage: user.image,
      userVerified: user.verified,
      body: qnaAnswer.body,
      ogCard: qnaAnswer.ogCard,
      score: qnaAnswer.score,
      accepted: qnaAnswer.accepted,
      createdAt: qnaAnswer.createdAt,
      myVote: sql<number>`coalesce((select ${qnaVote.value} from ${qnaVote} where ${qnaVote.userId} = ${vid} and ${qnaVote.targetType} = 'answer' and ${qnaVote.targetId} = ${qnaAnswer.id}), 0)`,
    })
    .from(qnaAnswer)
    .leftJoin(user, eq(qnaAnswer.authorId, user.id))
    .where(eq(qnaAnswer.questionId, questionId))
    .orderBy(desc(qnaAnswer.accepted), desc(qnaAnswer.score), desc(qnaAnswer.createdAt));

  return rows.map((r) => ({
    id: r.id,
    questionId: r.questionId,
    author: author(r.authorId, r.userName, r.userImage, r.userVerified),
    body: r.body,
    ogCard: r.ogCard ?? null,
    score: r.score,
    accepted: r.accepted,
    createdAt: r.createdAt.toISOString(),
    myVote: Number(r.myVote),
  }));
}

export async function listQnaComments(
  targetType: "question" | "answer",
  targetId: string,
): Promise<QnaCommentRow[]> {
  const rows = await db
    .select({
      id: qnaComment.id,
      targetType: qnaComment.targetType,
      targetId: qnaComment.targetId,
      authorId: qnaComment.authorId,
      userName: user.name,
      userImage: user.image,
      userVerified: user.verified,
      body: qnaComment.body,
      createdAt: qnaComment.createdAt,
    })
    .from(qnaComment)
    .leftJoin(user, eq(qnaComment.authorId, user.id))
    .where(and(eq(qnaComment.targetType, targetType), eq(qnaComment.targetId, targetId)))
    .orderBy(qnaComment.createdAt);

  return rows.map((r) => ({
    id: r.id,
    targetType: r.targetType,
    targetId: r.targetId,
    author: author(r.authorId, r.userName, r.userImage, r.userVerified),
    body: r.body,
    createdAt: r.createdAt.toISOString(),
  }));
}

export async function insertQuestion(a: {
  authorId: string;
  title: string;
  body: string;
  tags: string[];
  ogCard?: OgCardData | null;
}): Promise<string> {
  const id = genId();
  await db.insert(qnaQuestion).values({
    id,
    authorId: a.authorId,
    title: a.title,
    body: a.body,
    tags: a.tags,
    ogCard: normalizeOgCard(a.ogCard),
  });
  return id;
}

export async function insertAnswer(a: {
  questionId: string;
  authorId: string;
  body: string;
  ogCard?: OgCardData | null;
}): Promise<string> {
  const id = genId();
  await db.insert(qnaAnswer).values({
    id,
    questionId: a.questionId,
    authorId: a.authorId,
    body: a.body,
    ogCard: normalizeOgCard(a.ogCard),
  });
  await db
    .update(qnaQuestion)
    .set({ answerCount: sql`${qnaQuestion.answerCount} + 1` })
    .where(eq(qnaQuestion.id, a.questionId));
  return id;
}

export async function insertQnaComment(a: {
  targetType: "question" | "answer";
  targetId: string;
  authorId: string;
  body: string;
}): Promise<string> {
  const id = genId();
  await db.insert(qnaComment).values({
    id,
    targetType: a.targetType,
    targetId: a.targetId,
    authorId: a.authorId,
    body: a.body,
  });
  return id;
}

export async function applyQnaVote(
  userId: string,
  targetType: "question" | "answer",
  targetId: string,
  value: 1 | -1,
): Promise<number> {
  const target = targetType === "question" ? qnaQuestion : qnaAnswer;
  const [existing] = await db
    .select({ value: qnaVote.value })
    .from(qnaVote)
    .where(
      and(
        eq(qnaVote.userId, userId),
        eq(qnaVote.targetType, targetType),
        eq(qnaVote.targetId, targetId),
      ),
    )
    .limit(1);

  let delta = 0;
  if (!existing) {
    await db.insert(qnaVote).values({ userId, targetType, targetId, value });
    delta = value;
  } else if (existing.value === value) {
    await db
      .delete(qnaVote)
      .where(
        and(
          eq(qnaVote.userId, userId),
          eq(qnaVote.targetType, targetType),
          eq(qnaVote.targetId, targetId),
        ),
      );
    delta = -value;
  } else {
    await db
      .update(qnaVote)
      .set({ value })
      .where(
        and(
          eq(qnaVote.userId, userId),
          eq(qnaVote.targetType, targetType),
          eq(qnaVote.targetId, targetId),
        ),
      );
    delta = value - existing.value;
  }

  const [row] = await db
    .update(target)
    .set({ score: sql`${target.score} + ${delta}` })
    .where(eq(target.id, targetId))
    .returning({ score: target.score });
  return row?.score ?? 0;
}

export async function acceptAnswer(
  userId: string,
  questionId: string,
  answerId: string,
): Promise<void> {
  const [q] = await db
    .select({ authorId: qnaQuestion.authorId })
    .from(qnaQuestion)
    .where(eq(qnaQuestion.id, questionId))
    .limit(1);
  if (!q) return;

  if (q.authorId !== userId) {
    const [u] = await db.select({ role: user.role }).from(user).where(eq(user.id, userId)).limit(1);
    if ((u?.role ?? null) !== "admin") throw new Error("qna.err.forbidden");
  }

  await db.update(qnaAnswer).set({ accepted: false }).where(eq(qnaAnswer.questionId, questionId));
  await db.update(qnaAnswer).set({ accepted: true }).where(eq(qnaAnswer.id, answerId));
  await db
    .update(qnaQuestion)
    .set({ acceptedAnswerId: answerId })
    .where(eq(qnaQuestion.id, questionId));
}

export async function listTags(): Promise<{ tag: string; count: number }[]> {
  const rows = await db
    .select({
      tag: sql<string>`tag`,
      count: sql<number>`count(*)::int`,
    })
    .from(sql`${qnaQuestion}, jsonb_array_elements_text(${qnaQuestion.tags}) as tag`)
    .groupBy(sql`tag`)
    .orderBy(sql`count(*) desc`);
  return rows.map((r) => ({ tag: r.tag, count: Number(r.count) }));
}
