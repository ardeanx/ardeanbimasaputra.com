import { getSettings } from "@/lib/settings";
import AdSlot from "./AdSlot";

export default async function AdSlots({ pos }: { pos: "posTop" | "posMiddle" | "posBottom" }) {
  const settings = await getSettings();
  const ads = settings.integrations.ads;
  if (!ads.enabled || !ads.code || !ads[pos]) return null;
  return <AdSlot code={ads.code} />;
}
