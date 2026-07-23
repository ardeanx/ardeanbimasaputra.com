"use client";

import { useEffect, useState } from "react";
import type { DocHeading } from "@/components/content/RenderDoc";
import { useT } from "@/components/i18n/I18nProvider";

export default function Toc({ headings, title }: { headings: DocHeading[]; title?: string }) {
  const t = useT();
  const [active, setActive] = useState<string | null>(null);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const els = headings
      .map((h) => document.getElementById(h.id))
      .filter((el): el is HTMLElement => el != null);
    if (els.length === 0) return;
    const obs = new IntersectionObserver(
      (entries) => {
        const vis = entries.filter((e) => e.isIntersecting);
        if (vis.length === 0) return;
        const top = vis.reduce((a, b) =>
          a.boundingClientRect.top < b.boundingClientRect.top ? a : b,
        );
        setActive(top.target.id);
      },
      { rootMargin: "-80px 0px -70% 0px", threshold: 0 },
    );
    els.forEach((el) => obs.observe(el));
    return () => obs.disconnect();
  }, [headings]);

  if (headings.length === 0) return null;

  function go(id: string) {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
    history.replaceState(null, "", `#${id}`);
  }

  return (
    <div
      className="group fixed right-2 top-1/2 z-20 hidden -translate-y-1/2 lg:block"
      onPointerEnter={() => setOpen(true)}
      onPointerLeave={() => setOpen(false)}
    >
      <div className="flex flex-col items-end gap-2 py-4 pr-2">
        {headings.map((h, i) => (
          <button
            key={`${h.id}-${i}`}
            type="button"
            onClick={() => go(h.id)}
            aria-label={h.text}
            className={`h-[2px] rounded-full transition-colors ${
              active === h.id ? "bg-yt-text" : "bg-yt-text2/40 group-hover:bg-yt-text2/60"
            }`}
            style={{ width: `${28 - (h.level - 2) * 6}px` }}
          />
        ))}
      </div>

      {open && (
        <span aria-hidden className="absolute right-full top-1/2 h-[70vh] w-4 -translate-y-1/2" />
      )}
      {open && (
        <nav className="absolute right-full top-1/2 mr-2 max-h-[70vh] w-64 -translate-y-1/2 overflow-y-auto rounded-xl border border-yt-outline bg-yt-base p-3 shadow-xl">
          <p className="mb-2 text-xs font-semibold text-yt-text2">{title ?? t("post.contents")}</p>
          <ul className="space-y-0.5 text-sm">
            {headings.map((h, i) => (
              <li key={`${h.id}-${i}`} style={{ paddingLeft: `${(h.level - 2) * 12}px` }}>
                <button
                  type="button"
                  onClick={() => go(h.id)}
                  className={`block w-full truncate py-1 text-left transition-colors ${
                    active === h.id
                      ? "font-medium text-yt-text"
                      : "text-yt-text2 hover:text-yt-text"
                  }`}
                >
                  {h.text}
                </button>
              </li>
            ))}
          </ul>
        </nav>
      )}
    </div>
  );
}
