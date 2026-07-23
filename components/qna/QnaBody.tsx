import OgCard, { type OgCardData } from "@/components/og/OgCard";
import RichText from "@/components/rte/RichText";

export function hasRteContent(value: string): boolean {
  if (!value) return false;
  try {
    const doc = JSON.parse(value);
    let found = false;
    const walk = (node: unknown): void => {
      if (found || !node || typeof node !== "object") return;
      const n = node as { type?: string; text?: string; content?: unknown[] };
      if ((typeof n.text === "string" && n.text.trim()) || n.type === "image") {
        found = true;
        return;
      }
      for (const c of n.content ?? []) walk(c);
    };
    walk(doc);
    return found;
  } catch {
    return value.trim().length > 0;
  }
}

export default function QnaBody({ body, ogCard }: { body: string; ogCard?: OgCardData | null }) {
  return (
    <>
      <RichText value={body} className="text-[15px] text-yt-text" />
      {ogCard ? (
        <div className="mt-4">
          <OgCard data={ogCard} />
        </div>
      ) : null}
    </>
  );
}
