import { getSettings } from "./settings";

export type TranslateProvider = "deepl" | "googleTranslate";

export async function activeProvider(): Promise<TranslateProvider | null> {
  const s = await getSettings();
  if (s.integrations.deepl.enabled && s.integrations.deepl.apiKey) {
    return "deepl";
  }
  if (s.integrations.googleTranslate.enabled && s.integrations.googleTranslate.apiKey) {
    return "googleTranslate";
  }
  return null;
}

async function deeplTranslate(texts: string[], target: string, apiKey: string): Promise<string[]> {
  const free = apiKey.endsWith(":fx");
  const res = await fetch(`https://${free ? "api-free" : "api"}.deepl.com/v2/translate`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `DeepL-Auth-Key ${apiKey}`,
    },
    body: JSON.stringify({ text: texts, target_lang: target.toUpperCase() }),
  });
  if (!res.ok) throw new Error(`DeepL ${res.status}: ${await res.text()}`);
  const data = (await res.json()) as { translations: { text: string }[] };
  return data.translations.map((t) => t.text);
}

async function googleTranslateTexts(
  texts: string[],
  target: string,
  apiKey: string,
): Promise<string[]> {
  const res = await fetch(
    `https://translation.googleapis.com/language/translate/v2?key=${encodeURIComponent(apiKey)}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ q: texts, target, format: "text" }),
    },
  );
  if (!res.ok) {
    throw new Error(`Google Translate ${res.status}: ${await res.text()}`);
  }
  const data = (await res.json()) as {
    data: { translations: { translatedText: string }[] };
  };
  return data.data.translations.map((t) => t.translatedText);
}

export async function translateTexts(
  texts: string[],
  target: string,
): Promise<{ ok: true; result: string[] } | { error: string }> {
  if (texts.length === 0) return { ok: true, result: [] };
  const s = await getSettings();
  try {
    if (s.integrations.deepl.enabled && s.integrations.deepl.apiKey) {
      return {
        ok: true,
        result: await deeplTranslate(texts, target, s.integrations.deepl.apiKey),
      };
    }
    if (s.integrations.googleTranslate.enabled && s.integrations.googleTranslate.apiKey) {
      return {
        ok: true,
        result: await googleTranslateTexts(texts, target, s.integrations.googleTranslate.apiKey),
      };
    }
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Terjemahan gagal." };
  }
  return {
    error:
      "Tidak ada penyedia terjemahan aktif. Aktifkan DeepL atau Google Translate di Setelan Integrasi.",
  };
}

type DocNode = {
  type?: string;
  text?: string;
  content?: DocNode[];
  [k: string]: unknown;
};

export function collectDocTexts(doc: unknown): string[] {
  const out: string[] = [];
  const walk = (node: unknown): void => {
    if (!node || typeof node !== "object") return;
    const n = node as DocNode;
    if (typeof n.text === "string" && n.text.trim()) out.push(n.text);
    if (Array.isArray(n.content)) n.content.forEach(walk);
  };
  walk(doc);
  return out;
}

export function replaceDocTexts(doc: unknown, translated: string[]): unknown {
  let i = 0;
  const walk = (node: unknown): unknown => {
    if (!node || typeof node !== "object") return node;
    const n = { ...(node as DocNode) };
    if (typeof n.text === "string" && n.text.trim()) {
      n.text = translated[i++] ?? n.text;
    }
    if (Array.isArray(n.content)) n.content = n.content.map(walk) as DocNode[];
    return n;
  };
  return walk(doc);
}
