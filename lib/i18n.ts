import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import { cookies, headers } from "next/headers";
import { cache } from "react";
import { getSettings } from "./settings";

const DIR = path.join(process.cwd(), "locales");

export const DEFAULT_LOCALE = "en";

export type Dict = Record<string, string>;

const dictCache = new Map<string, Dict>();

export async function listLocales(): Promise<string[]> {
  try {
    const files = await readdir(DIR);
    return files
      .filter((f) => f.endsWith(".json"))
      .map((f) => f.slice(0, -5))
      .sort();
  } catch {
    return [DEFAULT_LOCALE];
  }
}

export async function loadDict(locale: string): Promise<Dict> {
  const safe = locale.replace(/[^a-zA-Z-]/g, "");
  const useCache = process.env.NODE_ENV === "production";
  if (useCache) {
    const hit = dictCache.get(safe);
    if (hit) return hit;
  }
  try {
    const raw = await readFile(path.join(DIR, `${safe}.json`), "utf8");
    const parsed = JSON.parse(raw) as Dict;
    if (useCache) dictCache.set(safe, parsed);
    return parsed;
  } catch {
    return {};
  }
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
