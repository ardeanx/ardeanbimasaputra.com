const SAFE_SCHEMES = ["http:", "https:", "mailto:", "tel:"];

export function safeHref(raw: string | null | undefined): string | undefined {
  if (!raw) return undefined;
  const value = raw.trim();
  if (!value) return undefined;
  if (value.startsWith("/") || value.startsWith("#")) return value;
  try {
    const url = new URL(value, "http://localhost");
    if (SAFE_SCHEMES.includes(url.protocol)) return value;
  } catch {}
  return undefined;
}
