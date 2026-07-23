import type { DetailPost } from "@/components/detail/types";
import type { AnswerRow, QuestionRow } from "./qna";

const CONTEXT = "https://schema.org";

function abs(path: string, base: string): string {
  try {
    return new URL(path, base).toString();
  } catch {
    return path;
  }
}

function iso(d: Date | string): string {
  return typeof d === "string" ? d : d.toISOString();
}

function isoDuration(sec: number): string {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `PT${m}M${s}S`;
}

function nodeText(node: unknown): string {
  if (!node || typeof node !== "object") return "";
  const n = node as { text?: string; content?: unknown[] };
  if (typeof n.text === "string") return n.text;
  if (Array.isArray(n.content)) return n.content.map(nodeText).join(" ");
  return "";
}

function descFrom(p: DetailPost): string | undefined {
  const raw = (p.excerpt || p.seoDescription || nodeText(p.body)).trim();
  return raw ? raw.slice(0, 200) : undefined;
}

function personOf(
  a: { name: string; username: string | null },
  base: string,
): Record<string, unknown> {
  const person: Record<string, unknown> = { "@type": "Person", name: a.name };
  if (a.username) person.url = `${base}/@${a.username}`;
  return person;
}

export function videoObject(p: DetailPost, base: string): Record<string, unknown> {
  const obj: Record<string, unknown> = {
    "@context": CONTEXT,
    "@type": "VideoObject",
    name: p.title,
    embedUrl: `${base}/watch?v=${p.id}`,
    interactionStatistic: {
      "@type": "InteractionCounter",
      interactionType: "https://schema.org/WatchAction",
      userInteractionCount: p.viewCount,
    },
    author: personOf(p.author, base),
  };
  const desc = descFrom(p);
  if (desc) obj.description = desc;
  if (p.thumbnail) obj.thumbnailUrl = [abs(p.thumbnail, base)];
  if (p.publishedAt) obj.uploadDate = iso(p.publishedAt);
  if (p.durationSec) obj.duration = isoDuration(p.durationSec);
  return obj;
}

export function blogPosting(
  p: DetailPost,
  base: string,
  publisher?: Record<string, unknown>,
): Record<string, unknown> {
  const obj: Record<string, unknown> = {
    "@context": CONTEXT,
    "@type": "BlogPosting",
    headline: p.title.slice(0, 110),
    mainEntityOfPage: `${base}/${p.slug}`,
    author: personOf(p.author, base),
  };
  if (publisher) obj.publisher = publisher;
  if (p.thumbnail) obj.image = [abs(p.thumbnail, base)];
  if (p.publishedAt) obj.datePublished = iso(p.publishedAt);
  if (p.updatedAt) obj.dateModified = iso(p.updatedAt);
  const desc = descFrom(p);
  if (desc) obj.description = desc;
  return obj;
}

type ProductLike = {
  title: string;
  slug: string;
  description: string | null;
  thumbnail: string | null;
  gallery: string[] | null;
  price: number;
  stock: number | null;
  owner: { name: string };
};

export function product(p: ProductLike, base: string, currency: string): Record<string, unknown> {
  const canonical = `${base}/store/${p.slug}`;
  const images = Array.from(
    new Set([p.thumbnail, ...(p.gallery ?? [])].filter((s): s is string => Boolean(s))),
  ).map((s) => abs(s, base));
  const inStock = p.stock === null || p.stock > 0;
  const obj: Record<string, unknown> = {
    "@context": CONTEXT,
    "@type": "Product",
    name: p.title,
    offers: {
      "@type": "Offer",
      price: String(p.price),
      priceCurrency: currency,
      availability: inStock ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
      url: canonical,
    },
  };
  if (images.length) obj.image = images;
  if (p.description) obj.description = p.description;
  if (p.owner?.name) obj.brand = { "@type": "Brand", name: p.owner.name };
  return obj;
}

export function qaPage(
  q: QuestionRow,
  answers: AnswerRow[],
  base: string,
): Record<string, unknown> {
  const url = `${base}/qna/${q.id}`;
  const toAnswer = (a: AnswerRow): Record<string, unknown> => ({
    "@type": "Answer",
    text: a.body,
    upvoteCount: a.score,
    url: `${url}#answer-${a.id}`,
    dateCreated: a.createdAt,
    author: { "@type": "Person", name: a.author.name },
  });
  const accepted = answers.find((a) => a.accepted);
  const suggested = answers.filter((a) => !a.accepted);
  const question: Record<string, unknown> = {
    "@type": "Question",
    name: q.title,
    text: q.body,
    answerCount: q.answerCount,
    upvoteCount: q.score,
    datePublished: q.createdAt,
    author: { "@type": "Person", name: q.author.name },
  };
  if (accepted) question.acceptedAnswer = toAnswer(accepted);
  if (suggested.length) question.suggestedAnswer = suggested.map(toAnswer);
  return {
    "@context": CONTEXT,
    "@type": "QAPage",
    mainEntity: question,
  };
}

export function breadcrumbList(items: { name: string; url: string }[]): Record<string, unknown> {
  return {
    "@context": CONTEXT,
    "@type": "BreadcrumbList",
    itemListElement: items.map((it, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: it.name,
      item: it.url,
    })),
  };
}
