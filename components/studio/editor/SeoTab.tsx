"use client";

import { useSyncExternalStore } from "react";
import { useT } from "@/components/i18n/I18nProvider";
import MediaPicker from "../MediaPicker";
import { useEditorCtx } from "./context";
import { Section, field } from "./parts";

const noopSubscribe = () => () => {};

function clip(s: string, max: number): string {
  return s.length > max ? `${s.slice(0, max).trimEnd()}…` : s;
}

function Counter({ len, max }: { len: number; max: number }) {
  return (
    <span className={`text-[11px] tabular-nums ${len > max ? "text-red-500" : "text-yt-text2"}`}>
      {len}/{max}
    </span>
  );
}

export default function SeoTab() {
  const t = useT();
  const { meta, setMeta } = useEditorCtx();
  const origin = useSyncExternalStore(
    noopSubscribe,
    () => window.location.origin,
    () => "",
  );

  const title = clip(meta.seoTitle || meta.title || t("editor.contentTitleFallback"), 60);
  const desc = clip(meta.seoDescription || meta.excerpt || t("editor.descFallback"), 160);
  const url = `${origin || "https://situs-anda.com"}/${meta.slug || "permalink"}`;

  return (
    <div className="divide-y divide-yt-outline/50">
      <Section title={t("editor.sec.googlePreview")}>
        <div className="rounded-lg border border-yt-outline bg-yt-base p-3">
          <p className="line-clamp-1 break-all text-base text-blue-700 dark:text-blue-400">
            {title}
          </p>
          <p className="mt-0.5 truncate text-xs text-green-700 dark:text-green-500">{url}</p>
          <p className="mt-1 line-clamp-2 text-xs text-yt-text2">{desc}</p>
        </div>
      </Section>

      <Section title={t("editor.sec.seoTitle")}>
        <input
          value={meta.seoTitle}
          onChange={(e) => setMeta({ seoTitle: e.target.value })}
          placeholder={meta.title || t("editor.seoTitlePlaceholder")}
          className={field}
        />
        <div className="mt-1 flex justify-end">
          <Counter len={meta.seoTitle.length} max={60} />
        </div>
      </Section>

      <Section title={t("editor.sec.seoDesc")}>
        <textarea
          value={meta.seoDescription}
          onChange={(e) => setMeta({ seoDescription: e.target.value })}
          rows={3}
          placeholder={t("editor.seoDescPlaceholder")}
          className={`${field} resize-none`}
        />
        <div className="mt-1 flex justify-end">
          <Counter len={meta.seoDescription.length} max={160} />
        </div>
      </Section>

      <Section title={t("editor.sec.ogImage")}>
        <MediaPicker value={meta.ogImage || null} onChange={(url) => setMeta({ ogImage: url })} />
        <p className="mt-2 text-xs text-yt-text2">{t("editor.ogImageHint")}</p>
      </Section>

      <Section title={t("editor.sec.canonical")}>
        <input
          value={meta.canonicalUrl}
          onChange={(e) => setMeta({ canonicalUrl: e.target.value })}
          placeholder={t("editor.canonicalPlaceholder")}
          className={field}
        />
      </Section>

      <Section title={t("editor.sec.indexing")}>
        <button
          type="button"
          role="switch"
          aria-checked={meta.noindex}
          onClick={() => setMeta({ noindex: !meta.noindex })}
          className="flex w-full items-center justify-between gap-3 text-left"
        >
          <span className="text-sm">{t("editor.hideFromSearch")}</span>
          <span
            className={`relative h-5 w-9 shrink-0 rounded-full transition-colors ${
              meta.noindex ? "bg-yt-cta" : "bg-yt-chip"
            }`}
          >
            <span
              className={`absolute top-0.5 h-4 w-4 rounded-full bg-white transition-all ${
                meta.noindex ? "left-[18px]" : "left-0.5"
              }`}
            />
          </span>
        </button>
        <p className="mt-2 text-xs text-yt-text2">{t("editor.noindexHint")}</p>
      </Section>
    </div>
  );
}
