import type { ReactNode } from "react";

type Mark = { type?: string; attrs?: { href?: string } };
type Node = {
  type?: string;
  text?: string;
  marks?: Mark[];
  attrs?: Record<string, unknown>;
  content?: Node[];
};

function safeHref(href: string): string | null {
  const h = href.trim();
  if (/^(https?:|mailto:)/i.test(h)) return h;
  return null;
}

function renderMarks(text: string, marks: Mark[] | undefined, key: string): ReactNode {
  let node: ReactNode = text;
  for (const m of marks ?? []) {
    if (m.type === "bold") node = <strong>{node}</strong>;
    else if (m.type === "italic") node = <em>{node}</em>;
    else if (m.type === "strike") node = <s>{node}</s>;
    else if (m.type === "code") node = <code className="rounded bg-yt-chip px-1">{node}</code>;
    else if (m.type === "link") {
      const href = safeHref(m.attrs?.href ?? "");
      if (href)
        node = (
          <a
            href={href}
            target="_blank"
            rel="noopener noreferrer nofollow"
            className="text-yt-cta hover:underline"
          >
            {node}
          </a>
        );
    }
  }
  return <span key={key}>{node}</span>;
}

function renderNodes(nodes: Node[] | undefined): ReactNode[] {
  return (nodes ?? []).map((n, i) => renderNode(n, String(i)));
}

function renderNode(node: Node, key: string): ReactNode {
  switch (node.type) {
    case "text":
      return renderMarks(node.text ?? "", node.marks, key);
    case "paragraph":
      return <p key={key}>{renderNodes(node.content)}</p>;
    case "heading": {
      const level = Number(node.attrs?.level) || 2;
      const cls =
        level <= 1
          ? "text-2xl font-semibold"
          : level === 2
            ? "text-xl font-semibold"
            : "text-lg font-semibold";
      const Tag = `h${Math.min(Math.max(level, 1), 6)}` as unknown as "h2";
      return (
        <Tag key={key} className={cls}>
          {renderNodes(node.content)}
        </Tag>
      );
    }
    case "bulletList":
      return (
        <ul key={key} className="list-disc pl-6">
          {renderNodes(node.content)}
        </ul>
      );
    case "orderedList":
      return (
        <ol key={key} className="list-decimal pl-6">
          {renderNodes(node.content)}
        </ol>
      );
    case "listItem":
      return <li key={key}>{renderNodes(node.content)}</li>;
    case "blockquote":
      return (
        <blockquote key={key} className="border-l-2 border-yt-outline pl-3 text-yt-text2">
          {renderNodes(node.content)}
        </blockquote>
      );
    case "codeBlock":
      return (
        <pre key={key} className="overflow-x-auto rounded-lg bg-yt-chip p-3 font-mono text-xs">
          <code>{renderNodes(node.content)}</code>
        </pre>
      );
    case "image": {
      const src = safeHref(String(node.attrs?.src ?? ""));
      if (!src) return null;
      return (
        <img
          key={key}
          src={src}
          alt={String(node.attrs?.alt ?? "")}
          className="my-2 max-w-full rounded-lg"
        />
      );
    }
    case "hardBreak":
      return <br key={key} />;
    default:
      return node.content ? <div key={key}>{renderNodes(node.content)}</div> : null;
  }
}

export default function RichText({ value, className }: { value: string; className?: string }) {
  let doc: Node | null = null;
  try {
    const parsed = JSON.parse(value);
    if (parsed && typeof parsed === "object" && parsed.type === "doc") doc = parsed as Node;
  } catch {
    doc = null;
  }

  if (!doc)
    return <div className={`whitespace-pre-wrap leading-7 ${className ?? ""}`}>{value}</div>;

  return (
    <div className={`space-y-3 leading-7 [&_a]:text-yt-cta ${className ?? ""}`}>
      {renderNodes(doc.content)}
    </div>
  );
}
