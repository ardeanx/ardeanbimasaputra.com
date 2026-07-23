"use client";

import Image from "@tiptap/extension-image";
import Link from "@tiptap/extension-link";
import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import {
  Bold,
  Code,
  Heading2,
  Heading3,
  ImageIcon,
  Italic,
  Link2,
  List,
  ListOrdered,
  Quote,
  Redo2,
  Undo2,
} from "lucide-react";
import type { Editor } from "@tiptap/react";
import type { ComponentType } from "react";
import { askInput } from "@/components/ui/dialog";

const EMPTY = { type: "doc", content: [{ type: "paragraph" }] };

function Btn({
  Icon,
  label,
  active,
  onClick,
  disabled,
}: {
  Icon: ComponentType<{ size?: number }>;
  label: string;
  active?: boolean;
  onClick: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      onClick={onClick}
      disabled={disabled}
      className={`grid h-8 w-8 place-items-center rounded-md hover:bg-yt-hover disabled:opacity-40 ${
        active ? "bg-yt-hover text-yt-cta" : "text-yt-text"
      }`}
    >
      <Icon size={17} />
    </button>
  );
}

function Toolbar({ editor }: { editor: Editor }) {
  async function setLink() {
    const prev = editor.getAttributes("link").href as string | undefined;
    const url = await askInput({
      title: "Tautan",
      placeholder: "https://…",
      initial: prev ?? "",
      confirmLabel: "Terapkan",
    });
    if (url === null) return;
    if (url.trim() === "") {
      editor.chain().focus().extendMarkRange("link").unsetLink().run();
      return;
    }
    editor.chain().focus().extendMarkRange("link").setLink({ href: url.trim() }).run();
  }

  async function addImage() {
    const url = await askInput({
      title: "Sisipkan gambar",
      placeholder: "https://… URL gambar",
      confirmLabel: "Sisipkan",
    });
    if (url && url.trim()) editor.chain().focus().setImage({ src: url.trim() }).run();
  }

  return (
    <div className="flex flex-wrap items-center gap-0.5 border-b border-yt-outline p-1.5">
      <Btn
        Icon={Bold}
        label="Tebal"
        active={editor.isActive("bold")}
        onClick={() => editor.chain().focus().toggleBold().run()}
      />
      <Btn
        Icon={Italic}
        label="Miring"
        active={editor.isActive("italic")}
        onClick={() => editor.chain().focus().toggleItalic().run()}
      />
      <Btn
        Icon={Code}
        label="Kode"
        active={editor.isActive("code")}
        onClick={() => editor.chain().focus().toggleCode().run()}
      />
      <span className="mx-1 h-5 w-px bg-yt-outline" />
      <Btn
        Icon={Heading2}
        label="Judul 2"
        active={editor.isActive("heading", { level: 2 })}
        onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
      />
      <Btn
        Icon={Heading3}
        label="Judul 3"
        active={editor.isActive("heading", { level: 3 })}
        onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
      />
      <Btn
        Icon={List}
        label="Daftar poin"
        active={editor.isActive("bulletList")}
        onClick={() => editor.chain().focus().toggleBulletList().run()}
      />
      <Btn
        Icon={ListOrdered}
        label="Daftar nomor"
        active={editor.isActive("orderedList")}
        onClick={() => editor.chain().focus().toggleOrderedList().run()}
      />
      <Btn
        Icon={Quote}
        label="Kutipan"
        active={editor.isActive("blockquote")}
        onClick={() => editor.chain().focus().toggleBlockquote().run()}
      />
      <span className="mx-1 h-5 w-px bg-yt-outline" />
      <Btn Icon={Link2} label="Tautan" active={editor.isActive("link")} onClick={setLink} />
      <Btn Icon={ImageIcon} label="Gambar" onClick={addImage} />
      <span className="mx-1 h-5 w-px bg-yt-outline" />
      <Btn
        Icon={Undo2}
        label="Urungkan"
        disabled={!editor.can().undo()}
        onClick={() => editor.chain().focus().undo().run()}
      />
      <Btn
        Icon={Redo2}
        label="Ulangi"
        disabled={!editor.can().redo()}
        onClick={() => editor.chain().focus().redo().run()}
      />
    </div>
  );
}

export default function PageBodyEditor({
  value,
  onChange,
}: {
  value: unknown;
  onChange: (doc: unknown) => void;
}) {
  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit,
      Link.configure({
        openOnClick: false,
        autolink: true,
        HTMLAttributes: { rel: "noopener noreferrer nofollow", target: "_blank" },
      }),
      Image.configure({ inline: false }),
    ],
    content: (value as object | null) ?? EMPTY,
    editorProps: {
      attributes: {
        class: "tiptap min-h-[280px] px-4 py-3 outline-none",
      },
    },
    onUpdate: ({ editor }) => onChange(editor.getJSON()),
  });

  return (
    <div className="rounded-lg border border-yt-outline bg-yt-raised">
      {editor && <Toolbar editor={editor} />}
      <EditorContent editor={editor} />
    </div>
  );
}
