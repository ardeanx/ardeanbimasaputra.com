"use server";

import { writeFile } from "node:fs/promises";
import path from "node:path";
import { revalidatePath } from "next/cache";
import { clearDictCache, listLocales, loadDict } from "@/lib/i18n";
import { getSession } from "@/lib/session";
import { translateTexts } from "@/lib/translate";

const CODE_RE = /^[a-z]{2}(-[a-z]{2})?$/i;

type ActionResult = { ok: true } | { error: string };

async function requireAdminSession(): Promise<string | null> {
  const session = await getSession();
  if (!session) return "Harus masuk.";
  const role = (session.user as { role?: string | null }).role ?? null;
  if (role !== "admin") return "Hanya admin yang berhak.";
  return null;
}

function localePath(code: string): string | null {
  if (!CODE_RE.test(code)) return null;
  return path.join(process.cwd(), "locales", `${code}.json`);
}

function cleanEntries(entries: Record<string, string>): Record<string, string> {
  const out: Record<string, string> = {};
  for (const [k, v] of Object.entries(entries)) {
    if (typeof k !== "string" || typeof v !== "string") continue;
    if (!v.trim()) continue;
    out[k] = v;
  }
  return out;
}

async function writeLocale(file: string, dict: Record<string, string>): Promise<void> {
  await writeFile(file, `${JSON.stringify(dict, null, 2)}\n`, "utf8");
  clearDictCache();
  revalidatePath("/studio/languages");
}

export async function addLocaleAction(code: string): Promise<ActionResult> {
  const denied = await requireAdminSession();
  if (denied) return { error: denied };
  const lower = code.trim().toLowerCase();
  const file = localePath(lower);
  if (!file) return { error: "Kode locale tidak valid (contoh: fr, pt-br)." };
  if ((await listLocales()).includes(lower)) {
    return { error: "Bahasa sudah ada." };
  }
  await writeLocale(file, {});
  return { ok: true };
}

export async function saveLocaleAction(
  code: string,
  entries: Record<string, string>,
): Promise<ActionResult> {
  const denied = await requireAdminSession();
  if (denied) return { error: denied };
  const lower = code.trim().toLowerCase();
  const file = localePath(lower);
  if (!file) return { error: "Kode locale tidak valid." };
  await writeLocale(file, cleanEntries(entries));
  return { ok: true };
}

export async function autoTranslateAction(
  code: string,
  entries: Record<string, string>,
): Promise<{ ok: true; filled: number; dict: Record<string, string> } | { error: string }> {
  const denied = await requireAdminSession();
  if (denied) return { error: denied };
  const lower = code.trim().toLowerCase();
  const file = localePath(lower);
  if (!file) return { error: "Kode locale tidak valid." };
  if (lower === "en") {
    return { error: "Bahasa default tidak bisa diterjemahkan otomatis." };
  }
  const en = await loadDict("en");
  const dict = cleanEntries(entries);
  const emptyKeys: string[] = [];
  const sources: string[] = [];
  for (const [k, v] of Object.entries(en)) {
    if (v.trim() && !dict[k]) {
      emptyKeys.push(k);
      sources.push(v);
    }
  }
  let filled = 0;
  if (emptyKeys.length > 0) {
    const res = await translateTexts(sources, lower);
    if ("error" in res) return { error: res.error };
    emptyKeys.forEach((k, i) => {
      const t = res.result[i];
      if (t?.trim()) {
        dict[k] = t;
        filled++;
      }
    });
  }
  await writeLocale(file, dict);
  return { ok: true, filled, dict };
}
