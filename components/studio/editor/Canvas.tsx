"use client";

import { DragHandle } from "@tiptap/extension-drag-handle-react";
import { type Editor, EditorContent } from "@tiptap/react";
import { GripVertical, Plus } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useT } from "@/components/i18n/I18nProvider";
import { BLOCKS, type BlockDef } from "@/lib/editor/blocks";
import SlashMenu from "../SlashMenu";
import BlockToolbar from "./BlockToolbar";
import { useEditorCtx } from "./context";
import ContextMenu from "./ContextMenu";

type Slash = {
  open: boolean;
  from: number;
  query: string;
  index: number;
  left: number;
  top: number;
};
const CLOSED: Slash = { open: false, from: 0, query: "", index: 0, left: 0, top: 0 };

function readSlash(editor: Editor): { from: number; query: string } | null {
  const sel = editor.state.selection;
  if (!sel.empty) return null;
  const $from = sel.$from;
  if ($from.parent.type.name !== "paragraph") return null;
  const before = $from.parent.textBetween(0, $from.parentOffset, "\n", "\0");
  const m = /^\/(\w*)$/.exec(before);
  if (!m) return null;
  return { from: sel.from, query: m[1] };
}

export default function Canvas() {
  const t = useT();
  const { editor, meta, setMeta, ui, setUi } = useEditorCtx();
  const ta = useRef<HTMLTextAreaElement>(null);
  const [slash, setSlash] = useState<Slash>(CLOSED);
  const [bubble, setBubble] = useState({ open: false, left: 0, top: 0 });
  const [ctxMenu, setCtxMenu] = useState<{ left: number; top: number } | null>(null);
  const slashRef = useRef<Slash>(CLOSED);

  const filtered = useMemo<BlockDef[]>(() => {
    const q = slash.query.toLowerCase();
    if (!q) return BLOCKS;
    return BLOCKS.filter(
      (b) => b.label.toLowerCase().includes(q) || b.keywords.some((k) => k.includes(q)),
    );
  }, [slash.query]);
  const filteredRef = useRef(filtered);

  useEffect(() => {
    slashRef.current = slash;
    filteredRef.current = filtered;
  }, [slash, filtered]);

  const slashItems = filtered.map((b) => ({
    key: b.key,
    label: b.label,
    hint: b.hint,
    icon: b.icon,
    run: b.run,
  }));

  const pick = useCallback(
    (block?: BlockDef) => {
      if (!editor || !block) return;
      const s = slashRef.current;
      editor
        .chain()
        .focus()
        .deleteRange({ from: s.from - s.query.length - 1, to: s.from })
        .run();
      block.run(editor);
      setSlash(CLOSED);
    },
    [editor],
  );

  useEffect(() => {
    if (!editor) return;
    const sync = () => {
      const hit = readSlash(editor);
      if (hit) {
        const c = editor.view.coordsAtPos(hit.from);
        setSlash((p) => ({
          open: true,
          from: hit.from,
          query: hit.query,
          index: hit.query === p.query ? p.index : 0,
          left: c.left,
          top: c.bottom + 6,
        }));
      } else {
        setSlash((p) => (p.open ? CLOSED : p));
      }
      const sel = editor.state.selection;
      if (!sel.empty && sel.$from.parent.type.name !== "codeBlock") {
        const a = editor.view.coordsAtPos(sel.from);
        const b = editor.view.coordsAtPos(sel.to);
        setBubble({
          open: true,
          left: (a.left + b.left) / 2,
          top: Math.min(a.top, b.top) - 48,
        });
      } else {
        setBubble((p) => (p.open ? { ...p, open: false } : p));
      }
    };
    const onKey = (event: KeyboardEvent) => {
      const s = slashRef.current;
      const list = filteredRef.current;
      if (!s.open || list.length === 0) return;
      if (event.key === "ArrowDown") {
        event.preventDefault();
        setSlash((p) => ({ ...p, index: (p.index + 1) % list.length }));
      } else if (event.key === "ArrowUp") {
        event.preventDefault();
        setSlash((p) => ({
          ...p,
          index: (p.index - 1 + list.length) % list.length,
        }));
      } else if (event.key === "Enter") {
        event.preventDefault();
        pick(list[s.index]);
      } else if (event.key === "Escape") {
        event.preventDefault();
        setSlash(CLOSED);
      }
    };
    editor.on("transaction", sync);
    editor.on("selectionUpdate", sync);
    editor.on("blur", () => setSlash(CLOSED));
    editor.view.dom.addEventListener("keydown", onKey, true);
    return () => {
      editor.off("transaction", sync);
      editor.off("selectionUpdate", sync);
      editor.view.dom.removeEventListener("keydown", onKey, true);
    };
  }, [editor, pick]);

  function growTitle() {
    const el = ta.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${el.scrollHeight}px`;
  }
  useEffect(growTitle, [meta.title]);

  return (
    <div className="canvas-scroll relative flex-1">
      <div className="mx-auto w-full max-w-[780px] px-6 py-14">
        <textarea
          ref={ta}
          rows={1}
          value={meta.title}
          onChange={(e) => setMeta({ title: e.target.value })}
          onInput={growTitle}
          placeholder={t("editor.addTitle")}
          maxLength={200}
          className="doc-title mb-8"
        />

        {ui.codeView ? (
          <textarea
            defaultValue={editor?.getHTML() ?? ""}
            onBlur={(e) => editor?.commands.setContent(e.target.value)}
            spellCheck={false}
            className="min-h-[50vh] w-full rounded-lg border border-yt-outline bg-yt-raised p-4 font-mono text-sm outline-none"
          />
        ) : (
          <div
            className={ui.distractionFree ? "" : "relative"}
            onContextMenu={(e) => {
              if (!editor) return;
              e.preventDefault();
              setCtxMenu({
                left: Math.max(8, Math.min(e.clientX, window.innerWidth - 240)),
                top: Math.max(8, Math.min(e.clientY, window.innerHeight - 380)),
              });
            }}
          >
            {editor && !ui.distractionFree && (
              <DragHandle editor={editor}>
                <div className="flex items-center gap-0.5 pr-1">
                  <button
                    type="button"
                    aria-label={t("editor.insertBlock")}
                    onClick={() => setUi({ inserter: true })}
                    className="grid h-6 w-5 place-items-center rounded text-yt-text2 hover:bg-yt-hover"
                  >
                    <Plus size={15} />
                  </button>
                  <span className="grid h-6 w-5 cursor-grab place-items-center rounded text-yt-text2 hover:bg-yt-hover">
                    <GripVertical size={15} />
                  </span>
                </div>
              </DragHandle>
            )}
            <EditorContent editor={editor} />
          </div>
        )}
      </div>

      {editor && bubble.open && !ui.codeView && (
        <BlockToolbar left={bubble.left} top={bubble.top} />
      )}

      {editor && ctxMenu && !ui.codeView && (
        <ContextMenu left={ctxMenu.left} top={ctxMenu.top} onClose={() => setCtxMenu(null)} />
      )}

      {editor && slash.open && filtered.length > 0 && (
        <SlashMenu
          items={slashItems}
          index={slash.index}
          left={slash.left}
          top={slash.top}
          onPick={(it) => pick(filtered.find((b) => b.key === it.key))}
        />
      )}
    </div>
  );
}
