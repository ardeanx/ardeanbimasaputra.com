import { type } from "arktype";

export const postMeta = type({
  title: "1 <= string <= 200",
  type: "'VIDEO' | 'AUDIO' | 'POST' | 'RESOURCE'",
  categoryId: "number | null",
  thumbnail: "string | null",
  "slug?": "string | null",
  "excerpt?": "string | null",
  "mediaUrl?": "string | null",
  "durationSec?": "number | null",
  "repoUrl?": "string | null",
  "visibility?": "'PUBLIC' | 'UNLISTED' | 'PRIVATE'",
  "seoTitle?": "string | null",
  "seoDescription?": "string | null",
  "ogImage?": "string | null",
  "canonicalUrl?": "string | null",
  "noindex?": "boolean",
});

export type PostMeta = typeof postMeta.infer;
