import { type Fmt, makeFmt } from "./format";
import { getLocale, getT } from "./i18n";

export async function getFmt(): Promise<Fmt> {
  const [locale, t] = await Promise.all([getLocale(), getT()]);
  return makeFmt(locale, {
    views: t("meta.views"),
    plays: t("meta.plays"),
    justNow: t("meta.justNow"),
  });
}
