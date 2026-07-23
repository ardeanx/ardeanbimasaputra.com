import katex from "katex";
import { highlight, langFromFilename } from "./shiki";

type DocNode = {
  type?: string;
  content?: DocNode[];
  attrs?: {
    language?: string | null;
    filename?: string | null;
    latex?: string | null;
    level?: number | null;
  };
  text?: string;
  __html?: string;
  __hid?: string;
};

function nodeText(n?: DocNode): string {
  if (!n) return "";
  const parts: string[] = [];
  const walk = (x?: DocNode) => {
    if (!x) return;
    if (typeof x.text === "string") parts.push(x.text);
    x.content?.forEach(walk);
  };
  walk(n);
  return parts.join(" ");
}

function baseHeadingId(n: DocNode): string {
  return nodeText(n)
    .toLowerCase()
    .trim()
    .replace(/[^\p{L}\p{N}\s-]/gu, "")
    .replace(/\s+/g, "-");
}

export async function prepareDoc(doc: unknown): Promise<unknown> {
  const root = doc as DocNode | null;
  if (!root) return doc;

  const code: DocNode[] = [];
  const math: DocNode[] = [];
  const seenHeadingIds = new Map<string, number>();
  const walk = (n?: DocNode) => {
    if (!n) return;
    if (n.type === "codeBlock") code.push(n);
    else if (n.type === "math") math.push(n);
    else if (n.type === "heading") {
      const base = baseHeadingId(n) || "bagian";
      const count = seenHeadingIds.get(base) ?? 0;
      seenHeadingIds.set(base, count + 1);
      n.__hid = count === 0 ? base : `${base}-${count + 1}`;
    }
    n.content?.forEach(walk);
  };
  walk(root);

  await Promise.all(
    code.map(async (n) => {
      const src = (n.content ?? []).map((c) => c.text ?? "").join("");
      const lang = n.attrs?.language || langFromFilename(n.attrs?.filename) || "text";
      n.__html = await highlight(src, lang);
    }),
  );

  for (const n of math) {
    try {
      n.__html = katex.renderToString(n.attrs?.latex ?? "", {
        displayMode: true,
        throwOnError: false,
      });
    } catch {
      n.__html = "";
    }
  }

  return root;
}
