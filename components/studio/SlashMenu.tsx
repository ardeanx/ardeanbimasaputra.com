"use client";

import type { Editor } from "@tiptap/react";

export type SlashItem = {
  key: string;
  label: string;
  hint: string;
  icon: string;
  run: (editor: Editor) => void;
};

export default function SlashMenu({
  items,
  index,
  left,
  top,
  onPick,
}: {
  items: SlashItem[];
  index: number;
  left: number;
  top: number;
  onPick: (item: SlashItem) => void;
}) {
  return (
    <div
      className="fixed z-50 max-h-72 w-64 overflow-y-auto rounded-xl border border-yt-outline bg-yt-menu p-1.5 shadow-xl"
      style={{ left, top }}
      onMouseDown={(e) => e.preventDefault()}
    >
      {items.map((it, i) => (
        <button
          key={it.key}
          type="button"
          onClick={() => onPick(it)}
          className={`flex w-full items-center gap-3 rounded-lg px-2.5 py-2 text-left ${
            i === index ? "bg-yt-hover" : "hover:bg-yt-hover"
          }`}
        >
          <span className="grid h-8 w-8 shrink-0 place-items-center rounded-md border border-yt-outline text-xs font-semibold">
            {it.icon}
          </span>
          <span className="min-w-0">
            <span className="block truncate text-sm font-medium text-yt-text">{it.label}</span>
            <span className="block truncate text-xs text-yt-text2">{it.hint}</span>
          </span>
        </button>
      ))}
    </div>
  );
}
