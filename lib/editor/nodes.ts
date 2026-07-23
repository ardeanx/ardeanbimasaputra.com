import { Node, mergeAttributes } from "@tiptap/core";
import Image from "@tiptap/extension-image";
import { ReactNodeViewRenderer } from "@tiptap/react";
import CodeBlockShiki from "tiptap-extension-code-block-shiki";
import {
  AccordionItemView,
  AccordionView,
  ButtonView,
  CalloutView,
  CardView,
  CodeBlockView,
  MathView,
  MermaidView,
  StepView,
  StepsView,
  TabView,
  TabsView,
} from "@/components/studio/editor/nodeviews";

export const CustomCodeBlock = CodeBlockShiki.extend({
  addAttributes() {
    return {
      ...this.parent?.(),
      filename: {
        default: null,
        parseHTML: (el) => el.getAttribute("data-filename"),
        renderHTML: (attrs) => (attrs.filename ? { "data-filename": attrs.filename } : {}),
      },
    };
  },
  addNodeView() {
    return ReactNodeViewRenderer(CodeBlockView);
  },
});

export const CustomImage = Image.extend({
  addAttributes() {
    return {
      ...this.parent?.(),
      width: {
        default: null,
        parseHTML: (el) => el.getAttribute("width"),
        renderHTML: (attrs) => (attrs.width ? { width: attrs.width } : {}),
      },
      align: {
        default: null,
        parseHTML: (el) => el.getAttribute("data-align"),
        renderHTML: (attrs) => (attrs.align ? { "data-align": attrs.align } : {}),
      },
    };
  },
});

export const Callout = Node.create({
  name: "callout",
  group: "block",
  content: "block+",
  defining: true,
  addAttributes() {
    return {
      variant: { default: "info" },
      title: { default: "" },
    };
  },
  parseHTML() {
    return [{ tag: "div[data-node=callout]" }];
  },
  renderHTML({ HTMLAttributes, node }) {
    return [
      "div",
      mergeAttributes(HTMLAttributes, {
        "data-node": "callout",
        "data-variant": node.attrs.variant,
        "data-title": node.attrs.title,
      }),
      0,
    ];
  },
  addNodeView() {
    return ReactNodeViewRenderer(CalloutView);
  },
});

export const ButtonBlock = Node.create({
  name: "button",
  group: "block",
  atom: true,
  selectable: true,
  draggable: true,
  addAttributes() {
    return {
      label: { default: "Tombol" },
      href: { default: "#" },
      variant: { default: "primary" },
    };
  },
  parseHTML() {
    return [{ tag: "a[data-node=button]" }];
  },
  renderHTML({ HTMLAttributes, node }) {
    return [
      "a",
      mergeAttributes(HTMLAttributes, {
        "data-node": "button",
        "data-variant": node.attrs.variant,
        href: node.attrs.href,
      }),
      node.attrs.label,
    ];
  },
  addNodeView() {
    return ReactNodeViewRenderer(ButtonView);
  },
});

export const Card = Node.create({
  name: "card",
  group: "block",
  atom: true,
  selectable: true,
  draggable: true,
  addAttributes() {
    return {
      title: { default: "Judul kartu" },
      description: { default: "" },
      href: { default: "" },
      icon: { default: "" },
    };
  },
  parseHTML() {
    return [{ tag: "div[data-node=card]" }];
  },
  renderHTML({ HTMLAttributes, node }) {
    return [
      "div",
      mergeAttributes(HTMLAttributes, {
        "data-node": "card",
        "data-href": node.attrs.href,
        "data-icon": node.attrs.icon,
        "data-description": node.attrs.description,
      }),
      node.attrs.title,
    ];
  },
  addNodeView() {
    return ReactNodeViewRenderer(CardView);
  },
});

export const Accordion = Node.create({
  name: "accordion",
  group: "block",
  content: "accordionItem+",
  parseHTML() {
    return [{ tag: "div[data-node=accordion]" }];
  },
  renderHTML({ HTMLAttributes }) {
    return ["div", mergeAttributes(HTMLAttributes, { "data-node": "accordion" }), 0];
  },
  addNodeView() {
    return ReactNodeViewRenderer(AccordionView);
  },
});

export const AccordionItem = Node.create({
  name: "accordionItem",
  content: "block+",
  defining: true,
  addAttributes() {
    return { title: { default: "Judul" } };
  },
  parseHTML() {
    return [{ tag: "div[data-node=accordion-item]" }];
  },
  renderHTML({ HTMLAttributes, node }) {
    return [
      "div",
      mergeAttributes(HTMLAttributes, {
        "data-node": "accordion-item",
        "data-title": node.attrs.title,
      }),
      0,
    ];
  },
  addNodeView() {
    return ReactNodeViewRenderer(AccordionItemView);
  },
});

export const Steps = Node.create({
  name: "steps",
  group: "block",
  content: "step+",
  parseHTML() {
    return [{ tag: "div[data-node=steps]" }];
  },
  renderHTML({ HTMLAttributes }) {
    return ["div", mergeAttributes(HTMLAttributes, { "data-node": "steps" }), 0];
  },
  addNodeView() {
    return ReactNodeViewRenderer(StepsView);
  },
});

export const Step = Node.create({
  name: "step",
  content: "block+",
  defining: true,
  parseHTML() {
    return [{ tag: "div[data-node=step]" }];
  },
  renderHTML({ HTMLAttributes }) {
    return ["div", mergeAttributes(HTMLAttributes, { "data-node": "step" }), 0];
  },
  addNodeView() {
    return ReactNodeViewRenderer(StepView);
  },
});

export const Tabs = Node.create({
  name: "tabs",
  group: "block",
  content: "tab+",
  parseHTML() {
    return [{ tag: "div[data-node=tabs]" }];
  },
  renderHTML({ HTMLAttributes }) {
    return ["div", mergeAttributes(HTMLAttributes, { "data-node": "tabs" }), 0];
  },
  addNodeView() {
    return ReactNodeViewRenderer(TabsView);
  },
});

export const Tab = Node.create({
  name: "tab",
  content: "block+",
  defining: true,
  addAttributes() {
    return { label: { default: "Tab" } };
  },
  parseHTML() {
    return [{ tag: "div[data-node=tab]" }];
  },
  renderHTML({ HTMLAttributes, node }) {
    return [
      "div",
      mergeAttributes(HTMLAttributes, {
        "data-node": "tab",
        "data-label": node.attrs.label,
      }),
      0,
    ];
  },
  addNodeView() {
    return ReactNodeViewRenderer(TabView);
  },
});

export const MathBlock = Node.create({
  name: "math",
  group: "block",
  atom: true,
  selectable: true,
  draggable: true,
  addAttributes() {
    return { latex: { default: "" } };
  },
  parseHTML() {
    return [{ tag: "div[data-node=math]" }];
  },
  renderHTML({ HTMLAttributes, node }) {
    return ["div", mergeAttributes(HTMLAttributes, { "data-node": "math" }), node.attrs.latex];
  },
  addNodeView() {
    return ReactNodeViewRenderer(MathView);
  },
});

export const MermaidBlock = Node.create({
  name: "mermaid",
  group: "block",
  atom: true,
  selectable: true,
  draggable: true,
  addAttributes() {
    return { code: { default: "" } };
  },
  parseHTML() {
    return [{ tag: "div[data-node=mermaid]" }];
  },
  renderHTML({ HTMLAttributes, node }) {
    return ["div", mergeAttributes(HTMLAttributes, { "data-node": "mermaid" }), node.attrs.code];
  },
  addNodeView() {
    return ReactNodeViewRenderer(MermaidView);
  },
});
