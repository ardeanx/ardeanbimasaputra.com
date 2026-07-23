"use client";

import { createContext, useContext } from "react";
import { type Fmt, makeFmt } from "@/lib/format";

type Dict = Record<string, string>;

const I18nContext = createContext<{ dict: Dict; fallback: Dict; locale: string }>({
  dict: {},
  fallback: {},
  locale: "en",
});

export function I18nProvider({
  dict,
  fallback,
  locale = "en",
  children,
}: {
  dict: Dict;
  fallback: Dict;
  locale?: string;
  children: React.ReactNode;
}) {
  return <I18nContext.Provider value={{ dict, fallback, locale }}>{children}</I18nContext.Provider>;
}

export function useT() {
  const { dict, fallback } = useContext(I18nContext);
  return (key: string, params?: Record<string, string | number>): string => {
    let out = dict[key] ?? fallback[key] ?? key;
    if (params) {
      for (const [k, v] of Object.entries(params)) {
        out = out.replaceAll(`{${k}}`, String(v));
      }
    }
    return out;
  };
}

export function useLocale(): string {
  return useContext(I18nContext).locale;
}

export function useFmt(): Fmt {
  const { dict, fallback, locale } = useContext(I18nContext);
  const tr = (key: string) => dict[key] ?? fallback[key] ?? key;
  return makeFmt(locale, {
    views: tr("meta.views"),
    plays: tr("meta.plays"),
    justNow: tr("meta.justNow"),
  });
}
