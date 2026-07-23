import LanguageManager from "@/components/studio/languages/LanguageManager";
import { getT, listLocales, loadDict } from "@/lib/i18n";
import { requireAdmin } from "@/lib/session";

export const dynamic = "force-dynamic";

export default async function StudioLanguages() {
  await requireAdmin();
  const t = await getT();
  const locales = await listLocales();
  const dicts: Record<string, Record<string, string>> = {};
  for (const code of locales) {
    dicts[code] = await loadDict(code);
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-6">
      <h1 className="mb-1 text-xl font-semibold text-yt-text">{t("studio.languages.title")}</h1>
      <p className="mb-6 text-sm text-yt-text2">{t("studio.languages.subtitle")}</p>
      <LanguageManager locales={locales} dicts={dicts} />
    </div>
  );
}
