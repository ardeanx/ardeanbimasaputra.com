import RenderDoc from "@/components/content/RenderDoc";
import { getSettings } from "@/lib/settings";
import AdSlot from "./AdSlot";

export default async function ArticleWithAd({ doc }: { doc: unknown }) {
  const settings = await getSettings();
  const ads = settings.integrations.ads;
  if (!ads.enabled || !ads.code || !ads.posMiddle) {
    return <RenderDoc doc={doc} />;
  }
  const root = doc as { content?: unknown[] } | null;
  const content = Array.isArray(root?.content) ? root.content : null;
  if (!content || content.length < 2) {
    return (
      <>
        <RenderDoc doc={doc} />
        <AdSlot code={ads.code} />
      </>
    );
  }
  const mid = Math.ceil(content.length / 2);
  return (
    <>
      <RenderDoc doc={{ ...root, content: content.slice(0, mid) }} />
      <AdSlot code={ads.code} />
      <RenderDoc doc={{ ...root, content: content.slice(mid) }} />
    </>
  );
}
