import type { Editor } from "@tiptap/react";
import { openImageDialog } from "@/components/studio/editor/ImageDialog";
import { askInput } from "@/components/ui/dialog";

export type BlockDef = {
  key: string;
  label: string;
  hint: string;
  icon: string;
  group: "Teks" | "Media" | "Tata letak" | "Dokumentasi";
  keywords: string[];
  run: (editor: Editor) => void;
  isActive?: (editor: Editor) => boolean;
};

async function promptYoutube(editor: Editor) {
  const url = await askInput({
    title: "Sematkan video YouTube",
    placeholder: "https://www.youtube.com/watch?v=…",
  });
  if (url) editor.chain().focus().setYoutubeVideo({ src: url }).run();
}

function ins(editor: Editor, content: Record<string, unknown>) {
  editor.chain().focus().insertContent(content).run();
}

function callout(variant: string) {
  return {
    type: "callout",
    attrs: { variant, title: "" },
    content: [{ type: "paragraph" }],
  };
}

export const BLOCKS: BlockDef[] = [
  {
    key: "paragraph",
    label: "Paragraf",
    hint: "Teks biasa",
    icon: "¶",
    group: "Teks",
    keywords: ["paragraf", "teks", "text"],
    run: (e) => e.chain().focus().setParagraph().run(),
    isActive: (e) => e.isActive("paragraph"),
  },
  {
    key: "h2",
    label: "Judul 2",
    hint: "Bagian besar",
    icon: "H2",
    group: "Teks",
    keywords: ["judul", "heading", "h2"],
    run: (e) => e.chain().focus().toggleHeading({ level: 2 }).run(),
    isActive: (e) => e.isActive("heading", { level: 2 }),
  },
  {
    key: "h3",
    label: "Judul 3",
    hint: "Sub-bagian",
    icon: "H3",
    group: "Teks",
    keywords: ["judul", "heading", "h3", "sub"],
    run: (e) => e.chain().focus().toggleHeading({ level: 3 }).run(),
    isActive: (e) => e.isActive("heading", { level: 3 }),
  },
  {
    key: "ul",
    label: "Daftar poin",
    hint: "Bullet",
    icon: "•",
    group: "Teks",
    keywords: ["daftar", "list", "poin", "bullet"],
    run: (e) => e.chain().focus().toggleBulletList().run(),
    isActive: (e) => e.isActive("bulletList"),
  },
  {
    key: "ol",
    label: "Daftar nomor",
    hint: "1. 2. 3.",
    icon: "1.",
    group: "Teks",
    keywords: ["daftar", "list", "nomor", "ordered"],
    run: (e) => e.chain().focus().toggleOrderedList().run(),
    isActive: (e) => e.isActive("orderedList"),
  },
  {
    key: "quote",
    label: "Kutipan",
    hint: "Blok kutipan",
    icon: "❝",
    group: "Teks",
    keywords: ["kutipan", "quote", "blockquote"],
    run: (e) => e.chain().focus().toggleBlockquote().run(),
    isActive: (e) => e.isActive("blockquote"),
  },
  {
    key: "code",
    label: "Blok kode",
    hint: "Kode",
    icon: "{}",
    group: "Teks",
    keywords: ["kode", "code", "snippet"],
    run: (e) => e.chain().focus().toggleCodeBlock().run(),
    isActive: (e) => e.isActive("codeBlock"),
  },
  {
    key: "image",
    label: "Gambar",
    hint: "Unggah atau URL",
    icon: "▣",
    group: "Media",
    keywords: ["gambar", "image", "foto", "unggah", "upload"],
    run: openImageDialog,
  },
  {
    key: "youtube",
    label: "Video YouTube",
    hint: "Sematkan",
    icon: "▶",
    group: "Media",
    keywords: ["video", "youtube", "embed", "sematkan"],
    run: promptYoutube,
  },
  {
    key: "table",
    label: "Tabel",
    hint: "3×3",
    icon: "▦",
    group: "Tata letak",
    keywords: ["tabel", "table", "grid"],
    run: (e) => e.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run(),
    isActive: (e) => e.isActive("table"),
  },
  {
    key: "hr",
    label: "Pemisah",
    hint: "Garis",
    icon: "―",
    group: "Tata letak",
    keywords: ["pemisah", "divider", "garis", "hr"],
    run: (e) => e.chain().focus().setHorizontalRule().run(),
  },
  {
    key: "callout-info",
    label: "Notice",
    hint: "Callout info",
    icon: "ℹ",
    group: "Dokumentasi",
    keywords: ["callout", "notice", "info", "catatan", "note"],
    run: (e) => ins(e, callout("info")),
  },
  {
    key: "callout-warning",
    label: "Warning",
    hint: "Callout peringatan",
    icon: "⚠",
    group: "Dokumentasi",
    keywords: ["callout", "warning", "peringatan"],
    run: (e) => ins(e, callout("warning")),
  },
  {
    key: "callout-danger",
    label: "Danger",
    hint: "Callout bahaya",
    icon: "⛔",
    group: "Dokumentasi",
    keywords: ["callout", "danger", "bahaya", "error"],
    run: (e) => ins(e, callout("danger")),
  },
  {
    key: "button",
    label: "Tombol",
    hint: "Tombol tautan",
    icon: "⬒",
    group: "Dokumentasi",
    keywords: ["tombol", "button", "cta", "tautan", "link"],
    run: (e) => ins(e, { type: "button" }),
  },
  {
    key: "card",
    label: "Kartu",
    hint: "Kartu tautan",
    icon: "▤",
    group: "Dokumentasi",
    keywords: ["kartu", "card", "tautan", "link"],
    run: (e) => ins(e, { type: "card" }),
  },
  {
    key: "accordion",
    label: "Akordeon",
    hint: "Buka-tutup",
    icon: "▾",
    group: "Dokumentasi",
    keywords: ["akordeon", "accordion", "faq", "buka", "tutup"],
    run: (e) =>
      ins(e, {
        type: "accordion",
        content: [
          {
            type: "accordionItem",
            attrs: { title: "Judul" },
            content: [{ type: "paragraph" }],
          },
        ],
      }),
  },
  {
    key: "steps",
    label: "Langkah",
    hint: "Daftar langkah",
    icon: "▤",
    group: "Dokumentasi",
    keywords: ["langkah", "steps", "tahap", "urutan"],
    run: (e) =>
      ins(e, {
        type: "steps",
        content: [{ type: "step", content: [{ type: "paragraph" }] }],
      }),
  },
  {
    key: "tabs",
    label: "Tab",
    hint: "Panel tab",
    icon: "▭",
    group: "Dokumentasi",
    keywords: ["tab", "tabs", "panel"],
    run: (e) =>
      ins(e, {
        type: "tabs",
        content: [{ type: "tab", attrs: { label: "Tab 1" }, content: [{ type: "paragraph" }] }],
      }),
  },
  {
    key: "math",
    label: "Rumus",
    hint: "LaTeX / KaTeX",
    icon: "∑",
    group: "Dokumentasi",
    keywords: ["rumus", "math", "latex", "katex", "matematika"],
    run: (e) => ins(e, { type: "math", attrs: { latex: "" } }),
  },
  {
    key: "mermaid",
    label: "Diagram",
    hint: "Mermaid",
    icon: "◈",
    group: "Dokumentasi",
    keywords: ["diagram", "mermaid", "flowchart", "grafik"],
    run: (e) => ins(e, { type: "mermaid", attrs: { code: "" } }),
  },
];
