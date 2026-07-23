import type { MetadataRoute } from "next";
import { baseUrl } from "@/lib/seo";
import { getSettings } from "@/lib/settings";

export default async function robots(): Promise<MetadataRoute.Robots> {
  const s = await getSettings();
  if (!s.seo.allowIndexing) {
    return { rules: [{ userAgent: "*", disallow: "/" }] };
  }
  return {
    rules: [
      {
        userAgent: "*",
        allow: ["/", "/api/og"],
        disallow: [
          "/studio",
          "/orders",
          "/settings",
          "/results",
          "/feed",
          "/api/auth",
          "/api/download",
        ],
      },
    ],
    sitemap: `${baseUrl()}/sitemap.xml`,
  };
}
