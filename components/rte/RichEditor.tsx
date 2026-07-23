"use client";

import Image from "@tiptap/extension-image";
import Link from "@tiptap/extension-link";
import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import {
  Bold,
  Code2,
  Image as ImageIcon,
  Italic,
  Link as LinkIcon,
  List,
  ListOrdered,
  Quote,
} from "lucide-react";
import type { ComponentType } from "react";
import { useT } from "@/components/i18n/I18nProvider";

type Editor = NonNullable<ReturnType<typeof useEditor>>;

type Tool = {
  icon: ComponentType<{ size?: number }>;
  labelKey: string;
  isActive: (e: Editor) => boolean;
  run: (e: Editor, t: (k: string) => string) => void;
};

const TOOLS: Tool[] = [
  {
    icon: Bold,
    labelKey: "editor.bold",
    isActive: (e) => e.isActive("bold"),
    run: (e) => e.chain().focus().toggleBold().run(),
  },
  {
    icon: Italic,
    labelKey: "editor.italic",
    isActive: (e) => e.isActive("italic"),
    run: (e) => e.chain().focus().toggleItalic().run(),
  },
  {
    icon: List,
    labelKey: "editor.list",
    isActive: (e) => e.isActive("bulletList"),
    run: (e) => e.chain().focus().toggleBulletList().run(),
  },
  {
    icon: ListOrdered,
    labelKey: "editor.orderedList",
    isActive: (e) => e.isActive("orderedList"),
    run: (e) => e.chain().focus().toggleOrderedList().run(),
  },
  {
    icon: Quote,
    labelKey: "editor.quote",
    isActive: (e) => e.isActive("blockquote"),
    run: (e) => e.chain().focus().toggleBlockquote().run(),
  },
  {
    icon: Code2,
    labelKey: "editor.codeBlock",
    isActive: (e) => e.isActive("codeBlock"),
    run: (e) => e.chain().focus().toggleCodeBlock().run(),
  },
  {
    icon: LinkIcon,
    labelKey: "editor.link",
    isActive: (e) => e.isActive("link"),
    run: (e, t) => {
      const prev = (e.getAttributes("link").href as string) ?? "";
      const url = window.prompt(t("editor.linkPrompt"), prev);
      if (url === null) return;
      if (url === "") {
        e.chain().focus().extendMarkRange("link").unsetLink().run();
        return;
      }
      e.chain().focus().extendMarkRange("link").setLink({ href: url }).run();
    },
  },
  {
    icon: ImageIcon,
    labelKey: "editor.image",
    isActive: () => false,
    run: (e, t) => {
      const url = window.prompt(t("editor.imagePrompt"), "");
      if (url) e.chain().focus().setImage({ src: url }).run();
    },
  },
];

export function extractFirstUrl(value: string): string | null {
  const re = /https?:\/\/[^\s"'<>)]+/i;
  try {
    const doc = JSON.parse(value);
    const found: string[] = [];
    const walk = (node: unknown): void => {
      if (!node || typeof node !== "object") return;
      const n = node as {
        type?: string;
        text?: string;
        marks?: { type?: string; attrs?: { href?: string } }[];
        attrs?: { src?: string; href?: string };
        content?: unknown[];
      };
      for (const m of n.marks ?? [])
        if (m.type === "link" && m.attrs?.href) found.push(m.attrs.href);
      if (typeof n.text === "string") {
        const m = n.text.match(re);
        if (m) found.push(m[0]);
      }
      for (const c of n.content ?? []) walk(c);
    };
    walk(doc);
    const hit = found.find((u) => re.test(u));
    return hit ?? null;
  } catch {
    const m = value.match(re);
    return m ? m[0] : null;
  }
}

export default function RichEditor({
  value,
  onChange,
  placeholder,
  minRows = 6,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  minRows?: number;
}) {
  const t = useT();
  const editor = useEditor({
    immediatelyRender: false,
    extensions: [StarterKit, Link.configure({ openOnClick: false, autolink: true }), Image],
    content: parseContent(value),
    editorProps: {
      attributes: {
        class: "tiptap-lite outline-none",
        style: `min-height:${minRows * 1.75}rem`,
        "data-placeholder": placeholder ?? "",
      },
    },
    onUpdate: ({ editor: e }) => onChange(JSON.stringify(e.getJSON())),
  });

  if (!editor) return <div className="rounded-xl border border-yt-outline bg-yt-raised" />;

  return (
    <div className="rounded-xl border border-yt-outline bg-yt-raised">
      <div className="flex flex-wrap gap-1 border-b border-yt-outline p-1">
        {TOOLS.map((tool) => {
          const Icon = tool.icon;
          const active = tool.isActive(editor);
          return (
            <button
              key={tool.labelKey}
              type="button"
              aria-label={t(tool.labelKey)}
              title={t(tool.labelKey)}
              onClick={() => tool.run(editor, t)}
              className={`grid h-8 w-8 place-items-center rounded-lg ${
                active ? "bg-yt-chip text-yt-text" : "text-yt-text2 hover:bg-yt-hover"
              }`}
            >
              <Icon size={16} />
            </button>
          );
        })}
      </div>
      <EditorContent
        editor={editor}
        className="px-3 py-2 text-sm leading-7 [&_a]:text-yt-cta [&_blockquote]:border-l-2 [&_blockquote]:border-yt-outline [&_blockquote]:pl-3 [&_blockquote]:text-yt-text2 [&_code]:rounded [&_code]:bg-yt-chip [&_code]:px-1 [&_h1]:text-2xl [&_h1]:font-semibold [&_h2]:text-xl [&_h2]:font-semibold [&_h3]:text-lg [&_h3]:font-semibold [&_img]:my-2 [&_img]:max-w-full [&_img]:rounded-lg [&_ol]:list-decimal [&_ol]:pl-6 [&_pre]:rounded-lg [&_pre]:bg-yt-chip [&_pre]:p-3 [&_pre]:font-mono [&_pre]:text-xs [&_ul]:list-disc [&_ul]:pl-6"
      />
    </div>
  );
}

function parseContent(value: string): object | string {
  if (!value) return "";
  try {
    const doc = JSON.parse(value);
    if (doc && typeof doc === "object" && (doc as { type?: string }).type === "doc")
      return doc as object;
    return value;
  } catch {
    return value;
  }
}
