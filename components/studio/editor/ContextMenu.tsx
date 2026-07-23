"use client";

import type { Editor, JSONContent } from "@tiptap/react";
import {
  Bold,
  ClipboardPaste,
  Copy,
  CopyPlus,
  Highlighter,
  Italic,
  Plus,
  Scissors,
  Trash2,
} from "lucide-react";
import { useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { toast } from "sonner";
import { useT } from "@/components/i18n/I18nProvider";
import { useEditorCtx } from "./context";

async function writeClipboard(text: string): Promise<boolean> {
  if (navigator.clipboard?.writeText) {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch {}
  }
  const ta = document.createElement("textarea");
  ta.value = text;
  ta.style.position = "fixed";
  ta.style.opacity = "0";
  document.body.appendChild(ta);
  ta.select();
  let ok = false;
  try {
    ok = document.execCommand("copy");
  } catch {}
  ta.remove();
  return ok;
}

function selectionText(editor: Editor): string {
  const { from, to } = editor.state.selection;
  return editor.state.doc.textBetween(from, to, "\n");
}

function topBlock(editor: Editor): { pos: number; end: number; json: JSONContent } | null {
  const sel = editor.state.selection;
  if (sel.$from.depth >= 1) {
    const node = sel.$from.node(1);
    const pos = sel.$from.before(1);
    return { pos, end: pos + node.nodeSize, json: node.toJSON() };
  }
  const node = editor.state.doc.nodeAt(sel.from);
  if (!node) return null;
  return { pos: sel.from, end: sel.from + node.nodeSize, json: node.toJSON() };
}

const item =
  "flex w-full items-center gap-3 px-4 py-2 text-left text-sm hover:bg-yt-hover disabled:pointer-events-none disabled:opacity-40";

function Sep() {
  return <div className="my-1 h-px bg-yt-outline/60" />;
}

export default function ContextMenu({
  left,
  top,
  onClose,
}: {
  left: number;
  top: number;
  onClose: () => void;
}) {
  const t = useT();
  const { editor, setUi } = useEditorCtx();
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onDown(e: PointerEvent) {
      if (!ref.current?.contains(e.target as Node)) onClose();
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    function onScroll(e: Event) {
      if (ref.current?.contains(e.target as Node)) return;
      onClose();
    }
    window.addEventListener("pointerdown", onDown);
    window.addEventListener("keydown", onKey);
    window.addEventListener("scroll", onScroll, true);
    window.addEventListener("resize", onClose);
    return () => {
      window.removeEventListener("pointerdown", onDown);
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("scroll", onScroll, true);
      window.removeEventListener("resize", onClose);
    };
  }, [onClose]);

  if (!editor) return null;
  const ed = editor;
  const hasSel = !ed.state.selection.empty;

  async function cut() {
    onClose();
    const text = selectionText(ed);
    if (await writeClipboard(text)) {
      ed.chain().focus().deleteSelection().run();
    } else {
      toast.error(t("editor.copyClipboardFailed"));
    }
  }

  async function copy() {
    onClose();
    if (!(await writeClipboard(selectionText(ed)))) {
      toast.error(t("editor.copyClipboardFailed"));
    }
  }

  async function paste() {
    onClose();
    if (!navigator.clipboard?.readText) {
      toast.error(t("editor.clipboardUnavailable"));
      return;
    }
    try {
      const text = await navigator.clipboard.readText();
      if (text) ed.chain().focus().insertContent(text).run();
    } catch {
      toast.error(t("editor.clipboardDenied"));
    }
  }

  function mark(fn: () => void) {
    onClose();
    fn();
  }

  function duplicate() {
    onClose();
    const b = topBlock(ed);
    if (!b) return;
    ed.chain().focus().insertContentAt(b.end, b.json).run();
  }

  function removeBlock() {
    onClose();
    const b = topBlock(ed);
    if (!b) return;
    ed.chain().focus().deleteRange({ from: b.pos, to: b.end }).run();
  }

  function insertBelow() {
    onClose();
    const b = topBlock(ed);
    if (b) {
      ed.chain()
        .focus()
        .insertContentAt(b.end, { type: "paragraph" })
        .setTextSelection(b.end + 1)
        .run();
    }
    setUi({ inserter: true });
  }

  return createPortal(
    <div
      ref={ref}
      style={{ left, top }}
      onMouseDown={(e) => e.preventDefault()}
      className="fixed z-[100] w-56 rounded-xl border border-yt-outline bg-yt-menu py-1.5 shadow-[0_4px_32px_rgba(0,0,0,0.3)]"
    >
      <button type="button" onClick={cut} disabled={!hasSel} className={item}>
        <Scissors size={15} /> {t("editor.cut")}
      </button>
      <button type="button" onClick={copy} disabled={!hasSel} className={item}>
        <Copy size={15} /> {t("editor.copy")}
      </button>
      <button type="button" onClick={paste} className={item}>
        <ClipboardPaste size={15} /> {t("editor.paste")}
      </button>
      <Sep />
      <button
        type="button"
        onClick={() => mark(() => ed.chain().focus().toggleBold().run())}
        className={item}
      >
        <Bold size={15} /> {t("editor.bold")}
      </button>
      <button
        type="button"
        onClick={() => mark(() => ed.chain().focus().toggleItalic().run())}
        className={item}
      >
        <Italic size={15} /> {t("editor.italic")}
      </button>
      <button
        type="button"
        onClick={() => mark(() => ed.chain().focus().toggleHighlight().run())}
        className={item}
      >
        <Highlighter size={15} /> {t("editor.highlight")}
      </button>
      <Sep />
      <button type="button" onClick={duplicate} className={item}>
        <CopyPlus size={15} /> {t("editor.duplicateBlock")}
      </button>
      <button type="button" onClick={removeBlock} className={`${item} text-red-500`}>
        <Trash2 size={15} /> {t("editor.deleteBlock")}
      </button>
      <button type="button" onClick={insertBelow} className={item}>
        <Plus size={15} /> {t("editor.insertBlockBelow")}
      </button>
    </div>,
    document.body,
  );
}
