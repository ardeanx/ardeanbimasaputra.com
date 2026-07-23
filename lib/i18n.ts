import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import { cookies, headers } from "next/headers";
import { cache } from "react";
import { translation, language } from "@/db/schema";
import { eq } from "drizzle-orm";
import { db } from "./db";
import { getSettings } from "./settings";

const DIR = path.join(process.cwd(), "locales");

export const DEFAULT_LOCALE = "en";

export type Dict = Record<string, string>;

const dictCache = new Map<string, Dict>();

async function listJsonLocales(): Promise<string[]> {
  try {
    const files = await readdir(DIR);
    return files
      .filter((f) => f.endsWith(".json"))
      .map((f) => f.slice(0, -5))
      .sort();
  } catch {
    return [];
  }
}

async function readJsonDict(locale: string): Promise<Dict> {
  const safe = locale.replace(/[^a-zA-Z-]/g, "");
  try {
    const raw = await readFile(path.join(DIR, `${safe}.json`), "utf8");
    return JSON.parse(raw) as Dict;
  } catch {
    return {};
  }
}

async function listDbLocales(): Promise<string[]> {
  try {
    const rows = await db
      .select({ code: language.code })
      .from(language)
      .where(eq(language.isActive, true));
    return rows.map((r) => r.code);
  } catch {
    return [];
  }
}

async function readDbDict(locale: string): Promise<Dict> {
  try {
    const rows = await db
      .select({ key: translation.key, value: translation.value })
      .from(translation)
      .where(eq(translation.locale, locale));
    const out: Dict = {};
    for (const r of rows) out[r.key] = r.value;
    return out;
  } catch {
    return {};
  }
}

export async function listLocales(): Promise<string[]> {
  const [jsonLocales, dbLocales] = await Promise.all([listJsonLocales(), listDbLocales()]);
  const merged = Array.from(new Set([...dbLocales, ...jsonLocales]));
  if (merged.length === 0) return [DEFAULT_LOCALE];
  return merged.sort();
}

export async function loadDict(locale: string): Promise<Dict> {
  const safe = locale.replace(/[^a-zA-Z-]/g, "");
  const useCache = process.env.NODE_ENV === "production";
  if (useCache) {
    const hit = dictCache.get(safe);
    if (hit) return hit;
  }
  const [jsonDict, dbDict] = await Promise.all([readJsonDict(safe), readDbDict(safe)]);
  const merged = { ...jsonDict, ...dbDict };
  if (useCache && Object.keys(merged).length > 0) dictCache.set(safe, merged);
  return merged;
}

export function clearDictCache(): void {
  dictCache.clear();
}

export const getLocale = cache(async (): Promise<string> => {
  const [jar, locales, settings] = await Promise.all([cookies(), listLocales(), getSettings()]);
  const wanted = jar.get("lang")?.value;
  if (wanted && locales.includes(wanted)) return wanted;
  if (settings.system.autoDetectLanguage) {
    const accepted = (await headers()).get("accept-language") ?? "";
    for (const part of accepted.split(",")) {
      const code = part.split(";")[0]?.trim().split("-")[0]?.toLowerCase();
      if (code && locales.includes(code)) return code;
    }
  }
  if (locales.includes(settings.system.defaultLanguage)) {
    return settings.system.defaultLanguage;
  }
  return DEFAULT_LOCALE;
});

export function translate(
  dict: Dict,
  fallback: Dict,
  key: string,
  params?: Record<string, string | number>,
): string {
  let out = dict[key] ?? fallback[key] ?? key;
  if (params) {
    for (const [k, v] of Object.entries(params)) {
      out = out.replaceAll(`{${k}}`, String(v));
    }
  }
  return out;
}

export const getT = cache(async () => {
  const locale = await getLocale();
  const dict = await loadDict(locale);
  const fallback = locale === DEFAULT_LOCALE ? dict : await loadDict(DEFAULT_LOCALE);
  return (key: string, params?: Record<string, string | number>) =>
    translate(dict, fallback, key, params);
});
