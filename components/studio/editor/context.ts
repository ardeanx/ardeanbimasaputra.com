"use client";

import type { Editor } from "@tiptap/react";
import { createContext, useContext } from "react";

export type PostType = "VIDEO" | "AUDIO" | "POST" | "RESOURCE";
export type Visibility = "PUBLIC" | "UNLISTED" | "PRIVATE";

export type EditorMeta = {
  id?: string;
  status: string;
  title: string;
  type: PostType;
  slug: string;
  categoryId: number | null;
  excerpt: string;
  thumbnail: string;
  visibility: Visibility;
  mediaUrl: string;
  durationSec: string;
  repoUrl: string;
  seoTitle: string;
  seoDescription: string;
  ogImage: string;
  canonicalUrl: string;
  noindex: boolean;
  viewCount: string;
};

export type EditorUi = {
  inserter: boolean;
  sidebar: boolean;
  tab: "post" | "block" | "seo" | "translate";
  distractionFree: boolean;
  codeView: boolean;
};

export type EditorCtx = {
  editor: Editor | null;
  meta: EditorMeta;
  setMeta: (patch: Partial<EditorMeta>) => void;
  ui: EditorUi;
  setUi: (patch: Partial<EditorUi>) => void;
  categories: { id: number; name: string }[];
  locales: string[];
  defaultLocale: string;
  isAdmin: boolean;
  pending: boolean;
  error?: string;
  tick: number;
};

export const EditorContext = createContext<EditorCtx | null>(null);

export function useEditorCtx(): EditorCtx {
  const ctx = useContext(EditorContext);
  if (!ctx) throw new Error("EditorContext tidak tersedia");
  return ctx;
}
