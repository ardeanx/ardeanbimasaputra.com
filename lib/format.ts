const compact = new Intl.NumberFormat("id-ID", {
  notation: "compact",
  maximumFractionDigits: 1,
});

export const fmtCompact = (n: number) => compact.format(n);

export const fmtViews = (n: number, type?: string) =>
  `${compact.format(n)} ${type === "VIDEO" || type === "AUDIO" ? "tayangan" : "dilihat"}`;

export const fmtPrice = (n: number) => `Rp${new Intl.NumberFormat("id-ID").format(n)}`;

export type FmtWords = { views: string; plays: string; justNow: string };

export type Fmt = {
  compact: (n: number) => string;
  views: (n: number, type?: string) => string;
  ago: (d: Date | string | null) => string;
  price: (n: number) => string;
};

export function makeFmt(locale: string, words: FmtWords): Fmt {
  const num = new Intl.NumberFormat(locale, {
    notation: "compact",
    maximumFractionDigits: 1,
  });
  const rel = new Intl.RelativeTimeFormat(locale, { numeric: "always" });
  return {
    compact: (n) => num.format(n),
    views: (n, type) =>
      `${num.format(n)} ${type === "VIDEO" || type === "AUDIO" ? words.plays : words.views}`,
    ago: (d) => {
      if (!d) return "";
      const date = typeof d === "string" ? new Date(d) : d;
      const s = (Date.now() - date.getTime()) / 1000;
      for (const [unit, sec] of UNITS) {
        if (s >= sec) return rel.format(-Math.floor(s / sec), unit);
      }
      return words.justNow;
    },
    price: fmtPrice,
  };
}

export function fmtBytes(n: number): string {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  if (n < 1024 * 1024 * 1024) return `${(n / 1024 / 1024).toFixed(1)} MB`;
  return `${(n / 1024 / 1024 / 1024).toFixed(2)} GB`;
}

const rtf = new Intl.RelativeTimeFormat("id", { numeric: "always" });
const UNITS: [Intl.RelativeTimeFormatUnit, number][] = [
  ["year", 31_536_000],
  ["month", 2_592_000],
  ["week", 604_800],
  ["day", 86_400],
  ["hour", 3_600],
  ["minute", 60],
];

export function fmtAgo(d: Date | string | null): string {
  if (!d) return "";
  const date = typeof d === "string" ? new Date(d) : d;
  const s = (Date.now() - date.getTime()) / 1000;
  for (const [unit, sec] of UNITS) {
    if (s >= sec) return rtf.format(-Math.floor(s / sec), unit);
  }
  return "baru saja";
}

export function bodyText(body: unknown): string {
  const parts: string[] = [];
  const walk = (node: unknown): void => {
    if (!node || typeof node !== "object") return;
    const n = node as { text?: string; content?: unknown[] };
    if (typeof n.text === "string") parts.push(n.text);
    if (Array.isArray(n.content)) n.content.forEach(walk);
  };
  walk(body);
  return parts.join(" ");
}
