"use client";

import { useEffect, useState } from "react";
import { type Gif, searchGifsAction } from "@/app/(shell)/threads/gif-actions";
import { useT } from "@/components/i18n/I18nProvider";

export default function GifPicker({ onSelect }: { onSelect: (url: string) => void }) {
  const t = useT();
  const [q, setQ] = useState("");
  const [gifs, setGifs] = useState<Gif[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const query = q.trim();
    if (!query) return;
    let active = true;
    const id = setTimeout(async () => {
      setLoading(true);
      const res = await searchGifsAction(query);
      if (!active) return;
      setGifs(res);
      setLoading(false);
    }, 350);
    return () => {
      active = false;
      clearTimeout(id);
    };
  }, [q]);

  const items = q.trim() ? gifs : [];

  return (
    <div className="flex w-72 flex-col gap-2 rounded-2xl border border-yt-outline bg-yt-menu p-3">
      <input
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder={t("thread.gif.search")}
        className="h-9 w-full rounded-full border border-yt-searchborder bg-yt-base px-4 text-sm text-yt-text outline-none placeholder:text-yt-text2"
      />
      <div className="grid max-h-64 grid-cols-2 gap-2 overflow-y-auto">
        {items.map((g) => (
          <button
            key={g.id}
            type="button"
            onClick={() => onSelect(g.url)}
            className="overflow-hidden rounded-xl bg-yt-hover"
          >
            <img src={g.preview} alt="" loading="lazy" className="h-24 w-full object-cover" />
          </button>
        ))}
      </div>
      {!loading && q.trim() && items.length === 0 ? (
        <p className="py-6 text-center text-sm text-yt-text2">{t("thread.gif.empty")}</p>
      ) : null}
      {loading ? (
        <p className="py-6 text-center text-sm text-yt-text2">{t("thread.gif.loading")}</p>
      ) : null}
    </div>
  );
}
