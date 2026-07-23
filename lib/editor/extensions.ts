import Link from "@tiptap/extension-link";
import Placeholder from "@tiptap/extension-placeholder";
import { Table, TableCell, TableHeader, TableRow } from "@tiptap/extension-table";
import TextAlign from "@tiptap/extension-text-align";
import { Color, TextStyle } from "@tiptap/extension-text-style";
import Highlight from "@tiptap/extension-highlight";
import Youtube from "@tiptap/extension-youtube";
import type { AnyExtension } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import {
  Accordion,
  AccordionItem,
  ButtonBlock,
  Callout,
  Card,
  CustomCodeBlock,
  CustomImage,
  MathBlock,
  MermaidBlock,
  Step,
  Steps,
  Tab,
  Tabs,
} from "./nodes";

export function editorExtensions(): AnyExtension[] {
  return [
    StarterKit.configure({ codeBlock: false }),
    CustomCodeBlock.configure({ defaultTheme: "github-dark" }),
    Callout,
    ButtonBlock,
    Card,
    Accordion,
    AccordionItem,
    Steps,
    Step,
    Tabs,
    Tab,
    MathBlock,
    MermaidBlock,
    Placeholder.configure({
      emptyNodeClass: "is-empty",
      placeholder: ({ node }) =>
        node.type.name === "heading"
          ? "Judul bagian"
          : "Ketik '/' untuk perintah, atau mulai menulis…",
    }),
    Link.configure({
      openOnClick: false,
      autolink: true,
      HTMLAttributes: { rel: "noopener noreferrer nofollow", target: "_blank" },
    }),
    CustomImage.configure({ inline: false }),
    TextStyle,
    Color,
    Highlight,
    TextAlign.configure({ types: ["heading", "paragraph"] }),
    Table.configure({ resizable: true }),
    TableRow,
    TableHeader,
    TableCell,
    Youtube.configure({ width: 640, height: 360, nocookie: true }),
  ];
}
