"use client";

import { NodeViewContent, NodeViewWrapper, type NodeViewProps } from "@tiptap/react";
import katex from "katex";
import "katex/dist/katex.min.css";
import {
  AlertTriangle,
  ExternalLink,
  FileCode2,
  Flame,
  Info,
  Pencil,
  StickyNote,
  CheckCircle2,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { useT } from "@/components/i18n/I18nProvider";
import Select from "@/components/ui/Select";
import { langFromFilename } from "@/lib/shiki";

type T = (key: string, params?: Record<string, string | number>) => string;

async function copyText(text: string): Promise<boolean> {
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

function addChild(props: NodeViewProps, content: Record<string, unknown>): void {
  const pos = typeof props.getPos === "function" ? props.getPos() : null;
  if (pos == null) return;
  const end = pos + props.node.nodeSize - 1;
  props.editor.chain().focus().insertContentAt(end, content).run();
}

const CALLOUT_ICON = {
  info: Info,
  note: StickyNote,
  warning: AlertTriangle,
  danger: Flame,
  success: CheckCircle2,
} as const;

export function calloutOptions(t: T) {
  return [
    { value: "info", label: t("editor.callout.info") },
    { value: "note", label: t("editor.callout.note") },
    { value: "warning", label: t("editor.callout.warning") },
    { value: "danger", label: t("editor.callout.danger") },
    { value: "success", label: t("editor.callout.success") },
  ];
}

export function CalloutView(props: NodeViewProps) {
  const t = useT();
  const variant = (props.node.attrs.variant as string) || "info";
  const title = (props.node.attrs.title as string) ?? "";
  const Icon = CALLOUT_ICON[variant as keyof typeof CALLOUT_ICON] ?? Info;
  return (
    <NodeViewWrapper className={`callout callout-${variant}`}>
      <div className="callout-head" contentEditable={false}>
        <Icon size={17} className="callout-icon" />
        <input
          value={title}
          onChange={(e) => props.updateAttributes({ title: e.target.value })}
          placeholder={t("editor.titleOptional")}
          className="callout-title-input"
        />
        <Select
          ariaLabel={t("editor.calloutType")}
          value={variant}
          onChange={(v) => props.updateAttributes({ variant: v })}
          options={calloutOptions(t)}
          buttonClassName="flex h-7 items-center gap-1 rounded-md border border-yt-outline px-2 text-xs hover:bg-yt-hover"
        />
      </div>
      <NodeViewContent className="callout-body" />
    </NodeViewWrapper>
  );
}

export function btnOptions(t: T) {
  return [
    { value: "primary", label: t("editor.btn.primary") },
    { value: "secondary", label: t("editor.btn.secondary") },
  ];
}

export function ButtonView(props: NodeViewProps) {
  const t = useT();
  const [edit, setEdit] = useState(false);
  const label = (props.node.attrs.label as string) || t("editor.buttonDefault");
  const href = (props.node.attrs.href as string) || "#";
  const variant = (props.node.attrs.variant as string) || "primary";
  return (
    <NodeViewWrapper className="atom-wrap" contentEditable={false}>
      <span className="atom-row">
        <span className={`docbtn docbtn-${variant}`}>{label}</span>
        <button
          type="button"
          className="atom-edit"
          aria-label={t("editor.editButton")}
          onClick={() => setEdit((v) => !v)}
        >
          <Pencil size={13} />
        </button>
      </span>
      {edit && (
        <div className="atom-pop">
          <input
            value={label}
            onChange={(e) => props.updateAttributes({ label: e.target.value })}
            placeholder={t("editor.buttonText")}
            className="atom-input"
          />
          <input
            value={href}
            onChange={(e) => props.updateAttributes({ href: e.target.value })}
            placeholder="https://…"
            className="atom-input"
          />
          <Select
            ariaLabel={t("editor.buttonStyle")}
            value={variant}
            onChange={(v) => props.updateAttributes({ variant: v })}
            options={btnOptions(t)}
          />
        </div>
      )}
    </NodeViewWrapper>
  );
}

export function CardView(props: NodeViewProps) {
  const t = useT();
  const [edit, setEdit] = useState(false);
  const title = (props.node.attrs.title as string) || t("editor.cardTitleDefault");
  const description = (props.node.attrs.description as string) || "";
  const href = (props.node.attrs.href as string) || "";
  const icon = (props.node.attrs.icon as string) || "";
  return (
    <NodeViewWrapper className="atom-wrap" contentEditable={false}>
      <span className="atom-row">
        <span className="doccard">
          <span className="doccard-icon">{icon || "📄"}</span>
          <span className="doccard-main">
            <span className="doccard-title">{title}</span>
            {description && <span className="doccard-desc">{description}</span>}
          </span>
          {href && <ExternalLink size={15} className="doccard-arrow" />}
        </span>
        <button
          type="button"
          className="atom-edit"
          aria-label={t("editor.editCard")}
          onClick={() => setEdit((v) => !v)}
        >
          <Pencil size={13} />
        </button>
      </span>
      {edit && (
        <div className="atom-pop">
          <input
            value={title}
            onChange={(e) => props.updateAttributes({ title: e.target.value })}
            placeholder={t("editor.title_")}
            className="atom-input"
          />
          <input
            value={description}
            onChange={(e) => props.updateAttributes({ description: e.target.value })}
            placeholder={t("editor.description")}
            className="atom-input"
          />
          <input
            value={href}
            onChange={(e) => props.updateAttributes({ href: e.target.value })}
            placeholder={t("editor.linkOptional")}
            className="atom-input"
          />
          <input
            value={icon}
            onChange={(e) => props.updateAttributes({ icon: e.target.value })}
            placeholder={t("editor.iconEmojiOptional")}
            className="atom-input"
          />
        </div>
      )}
    </NodeViewWrapper>
  );
}

export function AccordionView(props: NodeViewProps) {
  const t = useT();
  return (
    <NodeViewWrapper className="accordion">
      <NodeViewContent />
      <button
        type="button"
        contentEditable={false}
        className="block-add"
        onClick={() =>
          addChild(props, {
            type: "accordionItem",
            attrs: { title: t("editor.title_") },
            content: [{ type: "paragraph" }],
          })
        }
      >
        {t("editor.addItem")}
      </button>
    </NodeViewWrapper>
  );
}

export function AccordionItemView(props: NodeViewProps) {
  const t = useT();
  const title = (props.node.attrs.title as string) ?? "";
  return (
    <NodeViewWrapper className="accordion-item accordion-item-edit">
      <input
        contentEditable={false}
        value={title}
        onChange={(e) => props.updateAttributes({ title: e.target.value })}
        placeholder={t("editor.itemTitle")}
        className="accordion-title-input"
      />
      <NodeViewContent className="accordion-item-body" />
    </NodeViewWrapper>
  );
}

export function StepsView(props: NodeViewProps) {
  const t = useT();
  return (
    <NodeViewWrapper className="steps">
      <NodeViewContent />
      <button
        type="button"
        contentEditable={false}
        className="block-add"
        onClick={() =>
          addChild(props, {
            type: "step",
            content: [{ type: "paragraph" }],
          })
        }
      >
        {t("editor.addStep")}
      </button>
    </NodeViewWrapper>
  );
}

export function StepView() {
  return (
    <NodeViewWrapper className="step">
      <NodeViewContent />
    </NodeViewWrapper>
  );
}

export function TabsView(props: NodeViewProps) {
  const t = useT();
  return (
    <NodeViewWrapper className="tabs-edit">
      <NodeViewContent />
      <button
        type="button"
        contentEditable={false}
        className="block-add"
        onClick={() =>
          addChild(props, {
            type: "tab",
            attrs: { label: t("editor.tabDefault") },
            content: [{ type: "paragraph" }],
          })
        }
      >
        {t("editor.addTab")}
      </button>
    </NodeViewWrapper>
  );
}

export function TabView(props: NodeViewProps) {
  const t = useT();
  const label = (props.node.attrs.label as string) ?? "";
  return (
    <NodeViewWrapper className="tab-edit">
      <input
        contentEditable={false}
        value={label}
        onChange={(e) => props.updateAttributes({ label: e.target.value })}
        placeholder={t("editor.tabLabel")}
        className="tab-label-input"
      />
      <NodeViewContent className="tab-edit-body" />
    </NodeViewWrapper>
  );
}

export function MathView(props: NodeViewProps) {
  const t = useT();
  const [edit, setEdit] = useState(false);
  const latex = (props.node.attrs.latex as string) ?? "";
  const html = useMemo(() => {
    if (!latex.trim()) return "";
    try {
      return katex.renderToString(latex, {
        displayMode: true,
        throwOnError: false,
      });
    } catch {
      return "";
    }
  }, [latex]);
  return (
    <NodeViewWrapper className="mathblock-wrap" contentEditable={false}>
      <div className="mathblock" role="button" tabIndex={0} onClick={() => setEdit(true)}>
        {html ? (
          <span dangerouslySetInnerHTML={{ __html: html }} />
        ) : (
          <span className="mathblock-empty">{t("editor.mathEmpty")}</span>
        )}
      </div>
      {edit && (
        <textarea
          autoFocus
          value={latex}
          onChange={(e) => props.updateAttributes({ latex: e.target.value })}
          onBlur={() => setEdit(false)}
          placeholder="e = mc^2"
          className="block-code-input"
        />
      )}
    </NodeViewWrapper>
  );
}

let mermaidReady = false;
async function renderMermaid(el: HTMLElement | null, code: string) {
  if (!el) return;
  if (!code.trim()) {
    el.textContent = "";
    return;
  }
  const mermaid = (await import("mermaid")).default;
  const dark = document.documentElement.classList.contains("dark");
  if (!mermaidReady) {
    mermaid.initialize({ startOnLoad: false, securityLevel: "strict" });
    mermaidReady = true;
  }
  mermaid.initialize({
    startOnLoad: false,
    securityLevel: "strict",
    theme: dark ? "dark" : "default",
  });
  try {
    const { svg } = await mermaid.render(`m${Math.random().toString(36).slice(2)}`, code);
    el.innerHTML = svg;
  } catch (err) {
    el.textContent = String(err);
  }
}

export function MermaidView(props: NodeViewProps) {
  const code = (props.node.attrs.code as string) ?? "";
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    void renderMermaid(ref.current, code);
  }, [code]);
  return (
    <NodeViewWrapper className="mermaid-wrap" contentEditable={false}>
      <div ref={ref} className="mermaid-block" />
      <textarea
        value={code}
        onChange={(e) => props.updateAttributes({ code: e.target.value })}
        placeholder="graph TD; A-->B;"
        className="block-code-input"
      />
    </NodeViewWrapper>
  );
}

export function langOptions(t: T) {
  return [
    { value: "", label: t("editor.langAuto") },
    { value: "typescript", label: "TypeScript" },
    { value: "tsx", label: "TSX" },
    { value: "javascript", label: "JavaScript" },
    { value: "jsx", label: "JSX" },
    { value: "json", label: "JSON" },
    { value: "html", label: "HTML" },
    { value: "css", label: "CSS" },
    { value: "bash", label: "Bash" },
    { value: "python", label: "Python" },
    { value: "go", label: "Go" },
    { value: "rust", label: "Rust" },
    { value: "sql", label: "SQL" },
    { value: "yaml", label: "YAML" },
    { value: "markdown", label: "Markdown" },
    { value: "php", label: "PHP" },
    { value: "text", label: t("editor.langText") },
  ];
}

export function CodeBlockView(props: NodeViewProps) {
  const t = useT();
  const [copied, setCopied] = useState(false);
  const filename = (props.node.attrs.filename as string) ?? "";
  const language = (props.node.attrs.language as string) ?? "";
  const resolved = language || langFromFilename(filename) || "text";
  async function copy() {
    if (await copyText(props.node.textContent)) {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    }
  }
  return (
    <NodeViewWrapper className="codeblock">
      <div className="codeblock-head" contentEditable={false}>
        <FileCode2 size={14} className="codeblock-fileicon" aria-hidden />
        <span className="codeblock-lang">{resolved}</span>
        <input
          value={filename}
          onChange={(e) => props.updateAttributes({ filename: e.target.value })}
          placeholder={t("editor.filenamePlaceholder")}
          className="codeblock-file"
        />
        <Select
          ariaLabel={t("editor.codeLanguage")}
          value={language}
          onChange={(v) => props.updateAttributes({ language: v })}
          options={langOptions(t)}
          buttonClassName="flex h-7 items-center gap-1 rounded-md border border-yt-outline px-2 text-xs hover:bg-yt-hover"
        />
        <button type="button" onClick={copy} className="codeblock-copy">
          {copied ? t("editor.copied") : t("editor.copy")}
        </button>
      </div>
      <pre className="codeblock-pre">
        <NodeViewContent />
      </pre>
    </NodeViewWrapper>
  );
}
