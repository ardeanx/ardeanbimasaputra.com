"use client";

import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { Bold, Code2, Heading2, Heading3, Italic, List, ListOrdered, Quote } from "lucide-react";
import type { ComponentType } from "react";
import { useT } from "@/components/i18n/I18nProvider";

type Tool = {
  icon: ComponentType<{ size?: number }>;
  labelKey: string;
  isActive: (e: NonNullable<ReturnType<typeof useEditor>>) => boolean;
  run: (e: NonNullable<ReturnType<typeof useEditor>>) => void;
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
    icon: Heading2,
    labelKey: "editor.h2",
    isActive: (e) => e.isActive("heading", { level: 2 }),
    run: (e) => e.chain().focus().toggleHeading({ level: 2 }).run(),
  },
  {
    icon: Heading3,
    labelKey: "editor.h3",
    isActive: (e) => e.isActive("heading", { level: 3 }),
    run: (e) => e.chain().focus().toggleHeading({ level: 3 }).run(),
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
];

export default function ProductBodyEditor({
  value,
  onChange,
}: {
  value: unknown;
  onChange: (doc: unknown) => void;
}) {
  const t = useT();
  const editor = useEditor({
    immediatelyRender: false,
    extensions: [StarterKit],
    content: value && typeof value === "object" ? (value as object) : "",
    editorProps: {
      attributes: {
        class:
          "min-h-[220px] rounded-b-lg border border-t-0 border-yt-outline px-3 py-3 text-sm leading-6 outline-none [&_h2]:mb-2 [&_h2]:mt-4 [&_h2]:text-xl [&_h2]:font-semibold [&_h3]:mb-2 [&_h3]:mt-3 [&_h3]:text-lg [&_h3]:font-semibold [&_p]:my-2 [&_ul]:my-2 [&_ul]:list-disc [&_ul]:pl-6 [&_ol]:my-2 [&_ol]:list-decimal [&_ol]:pl-6 [&_blockquote]:my-3 [&_blockquote]:border-l-4 [&_blockquote]:border-yt-outline [&_blockquote]:pl-4 [&_blockquote]:text-yt-text2 [&_pre]:my-3 [&_pre]:rounded-lg [&_pre]:bg-yt-chip [&_pre]:p-3 [&_pre]:font-mono [&_pre]:text-xs",
      },
    },
    onUpdate: ({ editor: e }) => onChange(e.getJSON()),
  });

  if (!editor) {
    return <div className="min-h-[260px] rounded-lg border border-yt-outline" />;
  }

  return (
    <div>
      <div className="flex flex-wrap gap-1 rounded-t-lg border border-yt-outline bg-yt-raised p-1">
        {TOOLS.map((tool) => {
          const Icon = tool.icon;
          const active = tool.isActive(editor);
          return (
            <button
              key={tool.labelKey}
              type="button"
              aria-label={t(tool.labelKey)}
              onClick={() => tool.run(editor)}
              className={`grid h-8 w-8 place-items-center rounded ${
                active ? "bg-yt-chip text-yt-text" : "text-yt-text2 hover:bg-yt-hover"
              }`}
            >
              <Icon size={16} />
            </button>
          );
        })}
      </div>
      <EditorContent editor={editor} />
    </div>
  );
}
