"use server";

import { getSettings } from "@/lib/settings";

export type Gif = { id: string; url: string; preview: string };

type GiphyImage = { url?: string };
type GiphyItem = {
  id: string;
  images: {
    fixed_height: GiphyImage;
    fixed_height_small?: GiphyImage;
    downsized?: GiphyImage;
    original?: GiphyImage;
  };
};

export async function searchGifsAction(q: string): Promise<Gif[]> {
  const query = q.trim();
  if (!query) return [];
  const s = await getSettings();
  const g = s.integrations.giphy;
  if (!g.enabled || !g.apiKey) return [];

  try {
    const params = new URLSearchParams({
      api_key: g.apiKey,
      q: query,
      limit: "24",
      rating: "pg-13",
      bundle: "messaging_non_clips",
    });
    const res = await fetch(`https://api.giphy.com/v1/gifs/search?${params.toString()}`, {
      cache: "no-store",
      signal: AbortSignal.timeout(5000),
    });
    if (!res.ok) return [];
    const data = (await res.json()) as { data?: GiphyItem[] };
    return (data.data ?? [])
      .map((it) => {
        const url =
          it.images.downsized?.url ?? it.images.fixed_height.url ?? it.images.original?.url;
        const preview = it.images.fixed_height_small?.url ?? it.images.fixed_height.url ?? url;
        return url && preview ? { id: it.id, url, preview } : null;
      })
      .filter((x): x is Gif => x !== null);
  } catch {
    return [];
  }
}
