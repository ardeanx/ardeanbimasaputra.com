import { AlertTriangle, CheckCircle2, ExternalLink, Flame, Info, StickyNote } from "lucide-react";
import type { CSSProperties, ReactNode } from "react";
import "katex/dist/katex.min.css";
import { bodyText } from "@/lib/format";
import { getT } from "@/lib/i18n";
import { safeHref } from "@/lib/url";

type TFn = (key: string, params?: Record<string, string | number>) => string;
import CodeBlock from "./blocks/CodeBlock";
import Mermaid from "./blocks/Mermaid";
import Tabs from "./blocks/Tabs";
import ZoomImg from "./ZoomImg";

type Mark = {
  type: string;
  attrs?: { href?: string; color?: string };
};
type Attrs = {
  level?: number;
  src?: string;
  alt?: string;
  textAlign?: string;
  colspan?: number;
  rowspan?: number;
  start?: number;
  variant?: string;
  title?: string;
  label?: string;
  href?: string;
  icon?: string;
  description?: string;
  latex?: string;
  code?: string;
  filename?: string;
  language?: string;
  width?: string;
  align?: string;
};

const CALLOUT_ICON = {
  info: Info,
  note: StickyNote,
  warning: AlertTriangle,
  danger: Flame,
  success: CheckCircle2,
} as const;
type Node = {
  type?: string;
  content?: Node[];
  attrs?: Attrs;
  text?: string;
  marks?: Mark[];
  __html?: string;
  __hid?: string;
};

function headingId(node: Node): string {
  if (node.__hid) return node.__hid;
  return bodyText(node)
    .toLowerCase()
    .trim()
    .replace(/[^\p{L}\p{N}\s-]/gu, "")
    .replace(/\s+/g, "-");
}

export type DocHeading = { id: string; text: string; level: number };

export function extractHeadings(doc: unknown): DocHeading[] {
  const out: DocHeading[] = [];
  const walk = (n?: Node): void => {
    if (!n) return;
    if (n.type === "heading") {
      const text = bodyText(n).trim();
      if (text)
        out.push({
          id: headingId(n),
          text,
          level: Math.min(6, Math.max(2, n.attrs?.level ?? 2)),
        });
    }
    n.content?.forEach(walk);
  };
  walk(doc as Node | undefined);
  return out;
}

function Inline({ node }: { node: Node }) {
  let el: ReactNode = node.text;
  for (const mark of node.marks ?? []) {
    if (mark.type === "bold") el = <strong>{el}</strong>;
    else if (mark.type === "italic") el = <em>{el}</em>;
    else if (mark.type === "underline") el = <u>{el}</u>;
    else if (mark.type === "strike") el = <s>{el}</s>;
    else if (mark.type === "highlight")
      el = <mark className="rounded bg-yellow-200 px-0.5 dark:bg-yellow-300/40">{el}</mark>;
    else if (mark.type === "textStyle" && mark.attrs?.color)
      el = <span style={{ color: mark.attrs.color }}>{el}</span>;
    else if (mark.type === "code")
      el = <code className="rounded bg-yt-chip px-1.5 py-0.5 text-[0.9em]">{el}</code>;
    else if (mark.type === "link")
      el = (
        <a
          href={safeHref(mark.attrs?.href) ?? "#"}
          target="_blank"
          rel="noopener noreferrer nofollow"
          className="text-yt-cta hover:underline"
        >
          {el}
        </a>
      );
  }
  return <>{el}</>;
}

function Kids({ nodes, tr }: { nodes?: Node[]; tr: TFn }) {
  return (
    <>
      {(nodes ?? []).map((n, i) => (
        <NodeView key={i} node={n} tr={tr} />
      ))}
    </>
  );
}

function alignStyle(node: Node): CSSProperties | undefined {
  const a = node.attrs?.textAlign;
  return a && a !== "left" ? { textAlign: a as CSSProperties["textAlign"] } : undefined;
}

function NodeView({ node, tr }: { node: Node; tr: TFn }) {
  switch (node.type) {
    case "paragraph":
      return (
        <p className="my-3" style={alignStyle(node)}>
          <Kids nodes={node.content} tr={tr} />
        </p>
      );
    case "heading": {
      const level = Math.min(6, Math.max(2, node.attrs?.level ?? 2));
      const Tag = `h${level}` as "h2";
      const id = headingId(node);
      return (
        <Tag
          id={id || undefined}
          style={alignStyle(node)}
          className={
            level === 2
              ? "mb-2 mt-6 scroll-mt-20 text-2xl font-semibold"
              : "mb-2 mt-5 scroll-mt-20 text-xl font-semibold"
          }
        >
          <Kids nodes={node.content} tr={tr} />
        </Tag>
      );
    }
    case "bulletList":
      return (
        <ul className="my-3 list-disc space-y-1 pl-6">
          <Kids nodes={node.content} tr={tr} />
        </ul>
      );
    case "orderedList":
      return (
        <ol className="my-3 list-decimal space-y-1 pl-6">
          <Kids nodes={node.content} tr={tr} />
        </ol>
      );
    case "listItem":
      return (
        <li>
          <Kids nodes={node.content} tr={tr} />
        </li>
      );
    case "blockquote":
      return (
        <blockquote className="my-4 border-l-4 border-yt-outline pl-4 text-yt-text2">
          <Kids nodes={node.content} tr={tr} />
        </blockquote>
      );
    case "codeBlock":
      return (
        <CodeBlock html={node.__html} filename={node.attrs?.filename} lang={node.attrs?.language} />
      );
    case "callout": {
      const variant = node.attrs?.variant ?? "info";
      const Icon = CALLOUT_ICON[variant as keyof typeof CALLOUT_ICON] ?? Info;
      const title = node.attrs?.title;
      return (
        <div className={`callout callout-${variant} my-4`}>
          <div className="callout-head">
            <Icon size={17} className="callout-icon" />
            {title && <span className="callout-title">{title}</span>}
          </div>
          <div className="callout-body">
            <Kids nodes={node.content} tr={tr} />
          </div>
        </div>
      );
    }
    case "button": {
      const variant = node.attrs?.variant ?? "primary";
      return (
        <div className="my-3">
          <a
            href={safeHref(node.attrs?.href) ?? "#"}
            className={`docbtn docbtn-${variant}`}
            rel="noopener noreferrer"
          >
            {node.attrs?.label ?? tr("doc.button")}
          </a>
        </div>
      );
    }
    case "card": {
      const href = safeHref(node.attrs?.href);
      const inner = (
        <>
          <span className="doccard-icon">{node.attrs?.icon || "📄"}</span>
          <span className="doccard-main">
            <span className="doccard-title">{node.attrs?.title ?? tr("doc.card")}</span>
            {node.attrs?.description && (
              <span className="doccard-desc">{node.attrs.description}</span>
            )}
          </span>
          {href && <ExternalLink size={15} className="doccard-arrow" />}
        </>
      );
      return href ? (
        <a href={href} rel="noopener noreferrer" className="doccard doccard-link my-4">
          {inner}
        </a>
      ) : (
        <div className="doccard my-4">{inner}</div>
      );
    }
    case "accordion":
      return (
        <div className="accordion my-4">
          <Kids nodes={node.content} tr={tr} />
        </div>
      );
    case "accordionItem":
      return (
        <details className="accordion-item">
          <summary className="accordion-summary">{node.attrs?.title ?? tr("doc.item")}</summary>
          <div className="accordion-item-body">
            <Kids nodes={node.content} tr={tr} />
          </div>
        </details>
      );
    case "steps":
      return (
        <div className="steps my-4">
          <Kids nodes={node.content} tr={tr} />
        </div>
      );
    case "step":
      return (
        <div className="step">
          <Kids nodes={node.content} tr={tr} />
        </div>
      );
    case "tabs": {
      const tabs = node.content ?? [];
      return (
        <Tabs labels={tabs.map((t) => t.attrs?.label ?? tr("doc.tab"))}>
          {tabs.map((t, i) => (
            <Kids key={i} nodes={t.content} tr={tr} />
          ))}
        </Tabs>
      );
    }
    case "math":
      return (
        <div className="mathblock my-4" dangerouslySetInnerHTML={{ __html: node.__html ?? "" }} />
      );
    case "mermaid":
      return <Mermaid code={node.attrs?.code ?? ""} />;
    case "horizontalRule":
      return <hr className="my-6 border-yt-outline" />;
    case "image": {
      const w = node.attrs?.width;
      const align = node.attrs?.align;
      const imgStyle = w ? { width: /^\d+$/.test(w) ? `${w}px` : w, maxWidth: "100%" } : undefined;
      return (
        <div
          className={`my-4 ${
            align === "center" ? "text-center" : align === "right" ? "text-right" : ""
          }`}
        >
          <ZoomImg
            src={node.attrs?.src}
            alt={node.attrs?.alt ?? ""}
            className="inline-block max-w-full rounded-xl"
            style={imgStyle}
          />
        </div>
      );
    }
    case "youtube":
      return (
        <div className="my-4 aspect-video overflow-hidden rounded-xl">
          <iframe
            src={node.attrs?.src}
            title="YouTube"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            className="h-full w-full"
          />
        </div>
      );
    case "table":
      return (
        <div className="my-4 overflow-x-auto">
          <table className="w-full border-collapse text-sm">
            <tbody>
              <Kids nodes={node.content} tr={tr} />
            </tbody>
          </table>
        </div>
      );
    case "tableRow":
      return (
        <tr>
          <Kids nodes={node.content} tr={tr} />
        </tr>
      );
    case "tableHeader":
      return (
        <th
          colSpan={node.attrs?.colspan}
          rowSpan={node.attrs?.rowspan}
          className="border border-yt-outline bg-yt-chip px-3 py-2 text-left font-semibold"
        >
          <Kids nodes={node.content} tr={tr} />
        </th>
      );
    case "tableCell":
      return (
        <td
          colSpan={node.attrs?.colspan}
          rowSpan={node.attrs?.rowspan}
          className="border border-yt-outline px-3 py-2 align-top"
        >
          <Kids nodes={node.content} tr={tr} />
        </td>
      );
    case "hardBreak":
      return <br />;
    case "text":
      return <Inline node={node} />;
    default:
      return node.content ? <Kids nodes={node.content} tr={tr} /> : null;
  }
}

export default async function RenderDoc({ doc }: { doc: unknown }) {
  const root = doc as Node | null;
  if (!root?.content) return null;
  const tr = await getT();
  return <Kids nodes={root.content} tr={tr} />;
}
