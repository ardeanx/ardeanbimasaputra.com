import type { MetadataRoute } from "next";
import { getSettings } from "@/lib/settings";

export default async function manifest(): Promise<MetadataRoute.Manifest> {
  const s = await getSettings();
  const icon = s.appearance.logo ?? s.appearance.favicon;
  return {
    name: s.seo.siteTitle,
    short_name: s.system.appName,
    start_url: "/",
    display: "standalone",
    background_color: "#0f0f0f",
    theme_color: s.appearance.primaryColor || "#0f0f0f",
    icons: icon ? [{ src: icon, sizes: "any" }] : [],
  };
}
