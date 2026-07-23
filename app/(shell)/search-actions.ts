"use server";

import { cookies } from "next/headers";
import { listSearchHistory, recordSearch, removeSearch } from "@/lib/search-history";
import { getSession } from "@/lib/session";

export async function recordSearchAction(query: string): Promise<void> {
  const session = await getSession();
  if (!session) return;
  await recordSearch(session.user.id, query);
}

export async function listSearchHistoryAction(): Promise<string[]> {
  const session = await getSession();
  if (!session) return [];
  return listSearchHistory(session.user.id);
}

export async function removeSearchAction(query: string): Promise<void> {
  const session = await getSession();
  if (!session) return;
  await removeSearch(session.user.id, query);
}

export async function setLangAction(lang: string): Promise<void> {
  if (lang !== "id" && lang !== "en") return;
  const jar = await cookies();
  jar.set("lang", lang, { path: "/", maxAge: 60 * 60 * 24 * 365 });
}
