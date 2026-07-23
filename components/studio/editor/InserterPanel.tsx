"use client";

import { Search, X } from "lucide-react";
import { useMemo, useState } from "react";
import { useT } from "@/components/i18n/I18nProvider";
import { BLOCKS, type BlockDef } from "@/lib/editor/blocks";
import { useEditorCtx } from "./context";

export default function InserterPanel() {
  const t = useT();
  const { editor, setUi } = useEditorCtx();
  const [q, setQ] = useState("");

  const groups = useMemo(() => {
    const query = q.trim().toLowerCase();
    const match = BLOCKS.filter(
      (b) =>
        !query ||
        b.label.toLowerCase().includes(query) ||
        b.keywords.some((k) => k.includes(query)),
    );
    const map = new Map<string, BlockDef[]>();
    for (const b of match) {
      const arr = map.get(b.group) ?? [];
      arr.push(b);
      map.set(b.group, arr);
    }
    return [...map.entries()];
  }, [q]);

  function insert(block: BlockDef) {
    if (!editor) return;
    block.run(editor);
    editor.chain().focus().run();
  }

  return (
    <aside className="flex w-72 shrink-0 flex-col bg-yt-raised">
      <div className="flex items-center gap-2 p-3">
        <div className="flex h-9 flex-1 items-center gap-2 rounded-full bg-yt-chip px-3">
          <Search size={16} className="text-yt-text2" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder={t("editor.searchBlocks")}
            className="h-full w-full bg-transparent text-sm outline-none"
          />
        </div>
        <button
          type="button"
          aria-label={t("common.close")}
          onClick={() => setUi({ inserter: false })}
          className="grid h-9 w-9 shrink-0 place-items-center rounded-full hover:bg-yt-hover"
        >
          <X size={18} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-3 pb-4">
        {groups.length === 0 && (
          <p className="px-1 py-8 text-center text-sm text-yt-text2">{t("editor.noBlocks")}</p>
        )}
        {groups.map(([group, items]) => (
          <div key={group} className="mb-4">
            <h3 className="mb-2 px-1 text-xs font-semibold uppercase tracking-wide text-yt-text2">
              {group}
            </h3>
            <div className="grid grid-cols-3 gap-1">
              {items.map((b) => (
                <button
                  key={b.key}
                  type="button"
                  onClick={() => insert(b)}
                  title={b.hint}
                  className="flex flex-col items-center gap-1.5 rounded-lg border border-yt-outline/60 p-2 hover:bg-yt-hover"
                >
                  <span className="grid h-7 w-7 place-items-center text-sm font-semibold">
                    {b.icon}
                  </span>
                  <span className="line-clamp-1 text-[11px] text-yt-text2">{b.label}</span>
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>
    </aside>
  );
}
