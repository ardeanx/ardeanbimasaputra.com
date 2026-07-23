import type { AppSettings } from "./settings";

export function baseUrl(): string {
  return process.env.BETTER_AUTH_URL ?? "http://localhost:3000";
}

export function buildSiteJsonLd(s: AppSettings): Record<string, unknown>[] {
  const url = baseUrl();
  const out: Record<string, unknown>[] = [];
  const site: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": s.seo.schemaType === "Blog" ? "Blog" : "WebSite",
    name: s.seo.localSeo.websiteName || s.seo.siteTitle,
    url,
  };
  if (s.seo.localSeo.alternateName) {
    site.alternateName = s.seo.localSeo.alternateName;
  }
  if (s.seo.siteDescription) site.description = s.seo.siteDescription;
  site.potentialAction = {
    "@type": "SearchAction",
    target: {
      "@type": "EntryPoint",
      urlTemplate: `${url}/results?search_query={q}`,
    },
    "query-input": "required name=q",
  };
  out.push(site);

  const sameAs = Object.values(s.seo.socials).filter(Boolean);
  const ls = s.seo.localSeo;
  const wantsEntity =
    s.seo.schemaType === "Person" ||
    s.seo.schemaType === "Organization" ||
    ls.entityName ||
    sameAs.length > 0;
  if (wantsEntity) {
    const entityType =
      s.seo.schemaType === "Person" || s.seo.schemaType === "Organization"
        ? s.seo.schemaType
        : ls.entityType;
    const entity: Record<string, unknown> = {
      "@context": "https://schema.org",
      "@type": entityType,
      name: ls.entityName || s.system.appName,
      url: ls.url || url,
    };
    if (ls.logo) {
      entity[entityType === "Person" ? "image" : "logo"] = new URL(ls.logo, url).toString();
    }
    if (ls.email) entity.email = ls.email;
    if (ls.phone) entity.telephone = ls.phone;
    if (ls.address || ls.city || ls.country) {
      entity.address = {
        "@type": "PostalAddress",
        streetAddress: ls.address || undefined,
        addressLocality: ls.city || undefined,
        addressRegion: ls.region || undefined,
        addressCountry: ls.country || undefined,
        postalCode: ls.zip || undefined,
      };
    }
    if (sameAs.length > 0) entity.sameAs = sameAs;
    const subjectOf: string[] = [];
    if (ls.aboutUrl) subjectOf.push(ls.aboutUrl);
    if (ls.contactUrl) subjectOf.push(ls.contactUrl);
    if (subjectOf.length > 0) entity.subjectOf = subjectOf;
    out.push(entity);
  }
  return out;
}

export function applyTitleCase(title: string, enabled: boolean): string {
  if (!enabled) return title;
  const minor = new Set([
    "di",
    "ke",
    "dari",
    "dan",
    "atau",
    "yang",
    "untuk",
    "pada",
    "a",
    "an",
    "the",
    "of",
    "in",
    "on",
    "to",
    "and",
    "or",
    "for",
    "with",
  ]);
  return title
    .split(" ")
    .map((w, i) => {
      const lower = w.toLowerCase();
      if (i > 0 && minor.has(lower)) return lower;
      return w.charAt(0).toUpperCase() + w.slice(1);
    })
    .join(" ");
}
