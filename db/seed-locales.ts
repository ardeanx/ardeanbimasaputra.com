import { readFile } from "node:fs/promises";
import path from "node:path";
import { sql } from "drizzle-orm";
import { db } from "../lib/db";
import { language, translation } from "./schema";

type Dict = Record<string, string>;

const LOCALE_NAMES: Record<string, string> = {
  en: "English",
  id: "Bahasa Indonesia",
};

async function readDict(locale: string): Promise<Dict> {
  try {
    const raw = await readFile(path.join(process.cwd(), "locales", `${locale}.json`), "utf8");
    return JSON.parse(raw) as Dict;
  } catch {
    return {};
  }
}

async function seedLanguage(code: string) {
  const name = LOCALE_NAMES[code] ?? code;
  await db
    .insert(language)
    .values({ code, name, isActive: true })
    .onConflictDoUpdate({
      target: language.code,
      set: { name },
    });
  console.log(`language ${code} (${name}) upserted`);
}

async function seedTranslations(locale: string, dict: Dict) {
  const entries = Object.entries(dict).filter(([, v]) => typeof v === "string" && v.trim());
  if (entries.length === 0) {
    console.log(`no entries for ${locale}`);
    return;
  }
  await db.delete(translation).where(sql`${translation.locale} = ${locale}`);
  const BATCH = 200;
  for (let i = 0; i < entries.length; i += BATCH) {
    const chunk = entries.slice(i, i + BATCH).map(([key, value]) => ({
      locale,
      key,
      value,
    }));
    await db.insert(translation).values(chunk).onConflictDoUpdate({
      target: [translation.locale, translation.key],
      set: { value: sql.raw("excluded.value"), updatedAt: new Date() },
    });
  }
  console.log(`${locale}: ${entries.length} translation rows upserted`);
}

async function main() {
  const locales = ["en", "id"];
  for (const code of locales) {
    await seedLanguage(code);
    const dict = await readDict(code);
    await seedTranslations(code, dict);
  }
  console.log("locale seed complete");
  process.exit(0);
}

main().catch((err) => {
  console.error("locale seed failed:", err);
  process.exit(1);
});
