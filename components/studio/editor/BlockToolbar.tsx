"use client";

import {
  AlignCenter,
  AlignLeft,
  AlignRight,
  Bold,
  Code,
  Highlighter,
  Image as ImageIcon,
  Italic,
  Link2,
  Strikethrough,
} from "lucide-react";
import { useT } from "@/components/i18n/I18nProvider";
import { askInput } from "@/components/ui/dialog";
import { useEditorCtx } from "./context";
import { openImageDialog } from "./ImageDialog";

export default function BlockToolbar({ left, top }: { left: number; top: number }) {
  const t = useT();
  const { editor } = useEditorCtx();
  if (!editor) return null;

  const btn = (active: boolean) =>
    `grid h-8 w-8 place-items-center rounded hover:bg-yt-hover ${
      active ? "bg-yt-hover text-yt-cta" : ""
    }`;

  async function setLink() {
    if (!editor) return;
    const prev = editor.getAttributes("link").href as string | undefined;
    const url = await askInput({
      title: t("editor.linkUrl"),
      placeholder: "https://…",
      initial: prev ?? "",
      confirmLabel: t("editor.apply"),
    });
    if (url === null) return;
    if (url === "") editor.chain().focus().unsetLink().run();
    else editor.chain().focus().setLink({ href: url }).run();
  }

  return (
    <div
      className="fixed z-50 flex items-center gap-0.5 rounded-lg border border-yt-outline bg-yt-menu p-1 shadow-lg"
      style={{ left, top, transform: "translateX(-50%)" }}
      onMouseDown={(e) => e.preventDefault()}
    >
      <button
        type="button"
        className={btn(editor.isActive("bold"))}
        onClick={() => editor.chain().focus().toggleBold().run()}
      >
        <Bold size={16} />
      </button>
      <button
        type="button"
        className={btn(editor.isActive("italic"))}
        onClick={() => editor.chain().focus().toggleItalic().run()}
      >
        <Italic size={16} />
      </button>
      <button
        type="button"
        className={btn(editor.isActive("strike"))}
        onClick={() => editor.chain().focus().toggleStrike().run()}
      >
        <Strikethrough size={16} />
      </button>
      <button
        type="button"
        className={btn(editor.isActive("code"))}
        onClick={() => editor.chain().focus().toggleCode().run()}
      >
        <Code size={16} />
      </button>
      <button
        type="button"
        className={btn(editor.isActive("highlight"))}
        onClick={() => editor.chain().focus().toggleHighlight().run()}
      >
        <Highlighter size={16} />
      </button>
      <button type="button" className={btn(editor.isActive("link"))} onClick={setLink}>
        <Link2 size={16} />
      </button>
      <span className="mx-0.5 h-5 w-px bg-yt-outline" />
      <button
        type="button"
        className={btn(editor.isActive({ textAlign: "left" }))}
        onClick={() => editor.chain().focus().setTextAlign("left").run()}
      >
        <AlignLeft size={16} />
      </button>
      <button
        type="button"
        className={btn(editor.isActive({ textAlign: "center" }))}
        onClick={() => editor.chain().focus().setTextAlign("center").run()}
      >
        <AlignCenter size={16} />
      </button>
      <button
        type="button"
        className={btn(editor.isActive({ textAlign: "right" }))}
        onClick={() => editor.chain().focus().setTextAlign("right").run()}
      >
        <AlignRight size={16} />
      </button>
      <span className="mx-0.5 h-5 w-px bg-yt-outline" />
      <button
        type="button"
        aria-label={t("editor.insertImage")}
        className={btn(false)}
        onClick={() => openImageDialog(editor)}
      >
        <ImageIcon size={16} />
      </button>
    </div>
  );
}
