"use server";

import type { OgCardData } from "@/components/og/OgCard";

function isPrivateHost(host: string): boolean {
  const h = host.toLowerCase().replace(/\.$/, "");
  if (
    h === "localhost" ||
    h === "0.0.0.0" ||
    h === "::1" ||
    h.endsWith(".localhost") ||
    h.endsWith(".local") ||
    h.endsWith(".internal")
  )
    return true;
  const m = h.match(/^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/);
  if (m) {
    const [a, b] = [Number(m[1]), Number(m[2])];
    if (a === 10 || a === 127 || a === 0) return true;
    if (a === 169 && b === 254) return true;
    if (a === 192 && b === 168) return true;
    if (a === 172 && b >= 16 && b <= 31) return true;
  }
  if (h.startsWith("fc") || h.startsWith("fd") || h.startsWith("fe80")) return true;
  return false;
}

function pickMeta(html: string, keys: string[]): string | null {
  for (const key of keys) {
    const attr = key.startsWith("og:") || key.startsWith("twitter:") ? "property" : "name";
    const patterns = [
      new RegExp(
        `<meta[^>]+(?:${attr}|name|property)=["']${key}["'][^>]*content=["']([^"']*)["']`,
        "i",
      ),
      new RegExp(
        `<meta[^>]+content=["']([^"']*)["'][^>]*(?:${attr}|name|property)=["']${key}["']`,
        "i",
      ),
    ];
    for (const p of patterns) {
      const mm = html.match(p);
      if (mm && mm[1]) return decode(mm[1].trim());
    }
  }
  return null;
}

function decode(s: string): string {
  return s
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&#x27;/gi, "'");
}

export async function fetchOgCardAction(url: string): Promise<OgCardData | null> {
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return null;
  }
  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") return null;
  if (isPrivateHost(parsed.hostname)) return null;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 5000);
  try {
    const res = await fetch(parsed.toString(), {
      signal: controller.signal,
      redirect: "follow",
      headers: { "user-agent": "Mozilla/5.0 (compatible; ArdeanBot/1.0)" },
    });
    if (!res.ok) return null;
    const type = res.headers.get("content-type") ?? "";
    if (!type.includes("text/html") && !type.includes("xml")) return null;
    const html = (await res.text()).slice(0, 500_000);

    const title =
      pickMeta(html, ["og:title", "twitter:title"]) ??
      html.match(/<title[^>]*>([^<]*)<\/title>/i)?.[1]?.trim() ??
      null;
    const description = pickMeta(html, ["og:description", "twitter:description", "description"]);
    let image = pickMeta(html, ["og:image", "twitter:image", "twitter:image:src"]);
    if (image)
      try {
        image = new URL(image, parsed).toString();
      } catch {
        image = null;
      }
    const siteName = pickMeta(html, ["og:site_name"]) ?? parsed.hostname;

    if (!title && !description && !image) return null;
    return {
      url: parsed.toString(),
      title,
      description,
      image,
      siteName,
    };
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}
