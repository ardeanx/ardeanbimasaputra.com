import { appSetting } from "@/db/schema";
import { type } from "arktype";
import { eq } from "drizzle-orm";
import { cache } from "react";
import { db } from "./db";
import { cacheGet, cacheSet, redis } from "./redis";

const secret = "string <= 300";

export const settingsSchema = type({
  system: {
    appName: "1 <= string <= 60",
    adminEmail: "string <= 120",
    timezone: "string <= 60",
    dateFormat: "'dd/MM/yyyy' | 'MM/dd/yyyy' | 'yyyy-MM-dd' | 'd MMMM yyyy'",
    timeFormat: "'HH:mm' | 'hh:mm a'",
    defaultLanguage: "string <= 10",
    autoOptimizeImage: "boolean",
    enableCaching: "boolean",
    autoDetectLanguage: "boolean",
    allowRegistration: "boolean",
    defaultPostFormat: "'VIDEO' | 'AUDIO' | 'POST' | 'RESOURCE'",
    maintenance: "boolean",
    requireReview: "boolean",
    maxUploadMb: "1 <= number <= 500",
    allowVideoUpload: "boolean",
    fanoutNewContent: "boolean",
    notifyComments: "boolean",
    bellPollSec: "10 <= number <= 600",
  },
  appearance: {
    logo: "string | null",
    favicon: "string | null",
    authImage: "string | null",
    defaultTheme: "'system' | 'light' | 'dark'",
    primaryColor: /^#[0-9a-fA-F]{6}$/,
    enableSplashScreen: "boolean",
    siteFont: "'system' | 'inter' | 'roboto' | 'merriweather' | 'jetbrains-mono'",
    showChips: "boolean",
    copyright: "string <= 200",
    footerShowSocials: "boolean",
    footerShowPages: "boolean",
  },
  seo: {
    siteTitle: "1 <= string <= 100",
    siteDescription: "string <= 300",
    titleTemplate: "1 <= string <= 100",
    allowIndexing: "boolean",
    ogImage: "string | null",
    schemaType: "'WebSite' | 'Organization' | 'Person' | 'Blog'",
    nofollowExternal: "boolean",
    nofollowImageLinks: "boolean",
    externalNewTab: "boolean",
    autoLlmTxt: "boolean",
    rssFeed: "boolean",
    autoCapitalizeTitle: "boolean",
    localSeo: {
      entityType: "'Person' | 'Organization'",
      websiteName: "string <= 100",
      alternateName: "string <= 100",
      entityName: "string <= 100",
      logo: "string | null",
      url: "string <= 200",
      email: "string <= 120",
      phone: "string <= 40",
      address: "string <= 200",
      city: "string <= 80",
      region: "string <= 80",
      country: "string <= 80",
      zip: "string <= 20",
      aboutUrl: "string <= 200",
      contactUrl: "string <= 200",
    },
    socials: {
      youtube: "string <= 200",
      instagram: "string <= 200",
      tiktok: "string <= 200",
      facebook: "string <= 200",
      reddit: "string <= 200",
      x: "string <= 200",
      telegram: "string <= 200",
      linkedin: "string <= 200",
    },
  },
  integrations: {
    midtrans: {
      enabled: "boolean",
      serverKey: secret,
      clientKey: secret,
      production: "boolean",
    },
    push: {
      enabled: "boolean",
      vapidPublicKey: secret,
      vapidPrivateKey: secret,
      subject: "string <= 120",
    },
    brevo: {
      enabled: "boolean",
      apiKey: secret,
      fromEmail: "string <= 120",
      fromName: "string <= 60",
    },
    googleOauth: { enabled: "boolean", clientId: secret, clientSecret: secret },
    githubOauth: { enabled: "boolean", clientId: secret, clientSecret: secret },
    turnstile: { enabled: "boolean", siteKey: secret, secretKey: secret },
    bankTransfer: {
      enabled: "boolean",
      bankName: "string <= 60",
      accountNumber: "string <= 40",
      accountName: "string <= 80",
      instructions: "string <= 500",
    },
    googleTranslate: { enabled: "boolean", apiKey: secret },
    deepl: { enabled: "boolean", apiKey: secret },
    giphy: { enabled: "boolean", apiKey: secret },
    ads: {
      enabled: "boolean",
      code: "string <= 5000",
      posTop: "boolean",
      posMiddle: "boolean",
      posBottom: "boolean",
    },
    vast: {
      enabled: "boolean",
      tagUrl: "string <= 500",
      skipAfterSec: "0 <= number <= 60",
      timeoutSec: "1 <= number <= 30",
    },
  },
  security: {
    maxLoginAttempts: "3 <= number <= 20",
    lockoutMinutes: "1 <= number <= 1440",
    minPasswordLength: "6 <= number <= 64",
  },
  menu: {
    items: [
      {
        id: "string <= 40",
        label: "string <= 60",
        icon: "string <= 20000",
        iconType: "'lucide' | 'image'",
        url: "string <= 300",
        section: "'top' | 'explore' | 'bottom'",
        newTab: "boolean",
      },
      "[]",
    ],
  },
});

export type AppSettings = typeof settingsSchema.infer;

export const DEFAULT_SETTINGS: AppSettings = {
  system: {
    appName: "Ardean",
    adminEmail: "",
    timezone: "Asia/Jakarta",
    dateFormat: "d MMMM yyyy",
    timeFormat: "HH:mm",
    defaultLanguage: "en",
    autoOptimizeImage: true,
    enableCaching: true,
    autoDetectLanguage: true,
    allowRegistration: true,
    defaultPostFormat: "POST",
    maintenance: false,
    requireReview: true,
    maxUploadMb: 8,
    allowVideoUpload: false,
    fanoutNewContent: true,
    notifyComments: true,
    bellPollSec: 30,
  },
  appearance: {
    logo: null,
    favicon: null,
    authImage: null,
    defaultTheme: "system",
    primaryColor: "#065fd4",
    enableSplashScreen: false,
    siteFont: "system",
    showChips: true,
    copyright: "© 2026 Ardean",
    footerShowSocials: true,
    footerShowPages: true,
  },
  seo: {
    siteTitle: "Ardean",
    siteDescription: "Platform personal branding — konten, resource, dan toko.",
    titleTemplate: "%s · Ardean",
    allowIndexing: true,
    ogImage: null,
    schemaType: "WebSite",
    nofollowExternal: false,
    nofollowImageLinks: false,
    externalNewTab: true,
    autoLlmTxt: true,
    rssFeed: true,
    autoCapitalizeTitle: false,
    localSeo: {
      entityType: "Person",
      websiteName: "",
      alternateName: "",
      entityName: "",
      logo: null,
      url: "",
      email: "",
      phone: "",
      address: "",
      city: "",
      region: "",
      country: "",
      zip: "",
      aboutUrl: "",
      contactUrl: "",
    },
    socials: {
      youtube: "",
      instagram: "",
      tiktok: "",
      facebook: "",
      reddit: "",
      x: "",
      telegram: "",
      linkedin: "",
    },
  },
  integrations: {
    midtrans: { enabled: false, serverKey: "", clientKey: "", production: false },
    push: { enabled: false, vapidPublicKey: "", vapidPrivateKey: "", subject: "" },
    brevo: { enabled: false, apiKey: "", fromEmail: "", fromName: "" },
    googleOauth: { enabled: false, clientId: "", clientSecret: "" },
    githubOauth: { enabled: false, clientId: "", clientSecret: "" },
    turnstile: { enabled: false, siteKey: "", secretKey: "" },
    bankTransfer: {
      enabled: false,
      bankName: "",
      accountNumber: "",
      accountName: "",
      instructions: "",
    },
    googleTranslate: { enabled: false, apiKey: "" },
    deepl: { enabled: false, apiKey: "" },
    giphy: { enabled: false, apiKey: "" },
    ads: { enabled: false, code: "", posTop: true, posMiddle: false, posBottom: true },
    vast: { enabled: false, tagUrl: "", skipAfterSec: 5, timeoutSec: 8 },
  },
  security: {
    maxLoginAttempts: 5,
    lockoutMinutes: 15,
    minPasswordLength: 8,
  },
  menu: {
    items: [
      {
        id: "home",
        label: "Home",
        icon: "House",
        iconType: "lucide",
        url: "/",
        section: "top",
        newTab: false,
      },
      {
        id: "threads",
        label: "Threads",
        icon: "MessagesSquare",
        iconType: "lucide",
        url: "/threads",
        section: "top",
        newTab: false,
      },
      {
        id: "qna",
        label: "Q&A",
        icon: "CircleHelp",
        iconType: "lucide",
        url: "/qna",
        section: "top",
        newTab: false,
      },
      {
        id: "store",
        label: "Store",
        icon: "Store",
        iconType: "lucide",
        url: "/store",
        section: "top",
        newTab: false,
      },
      {
        id: "resources",
        label: "Resources",
        icon: "FileText",
        iconType: "lucide",
        url: "/resources",
        section: "top",
        newTab: false,
      },
      {
        id: "channels",
        label: "Channels",
        icon: "Users",
        iconType: "lucide",
        url: "/feed/subscriptions",
        section: "top",
        newTab: false,
      },
      {
        id: "creator",
        label: "Creator",
        icon: "Clapperboard",
        iconType: "lucide",
        url: "/studio",
        section: "top",
        newTab: false,
      },
    ],
  },
};

export function oauthFlags(s: AppSettings): { google: boolean; github: boolean } {
  const g = s.integrations.googleOauth;
  const h = s.integrations.githubOauth;
  return {
    google: g.enabled && g.clientId.length > 0 && g.clientSecret.length > 0,
    github: h.enabled && h.clientId.length > 0 && h.clientSecret.length > 0,
  };
}

export const SECRET_PATHS = [
  "integrations.midtrans.serverKey",
  "integrations.push.vapidPrivateKey",
  "integrations.brevo.apiKey",
  "integrations.googleOauth.clientSecret",
  "integrations.githubOauth.clientSecret",
  "integrations.turnstile.secretKey",
  "integrations.googleTranslate.apiKey",
  "integrations.deepl.apiKey",
  "integrations.giphy.apiKey",
] as const;

export const KEEP_SENTINEL = "__KEEP__";

const CACHE_KEY = "app:settings:v2";

type PlainObject = Record<string, unknown>;

function isPlain(v: unknown): v is PlainObject {
  return !!v && typeof v === "object" && !Array.isArray(v);
}

export function deepMerge<T>(base: T, patch: unknown): T {
  if (!isPlain(base) || !isPlain(patch)) return base;
  const out: PlainObject = { ...base };
  for (const [k, v] of Object.entries(patch)) {
    if (!(k in base)) continue;
    const bv = (base as PlainObject)[k];
    out[k] = isPlain(bv) && isPlain(v) ? deepMerge(bv, v) : v === undefined ? bv : v;
  }
  return out as T;
}

function getPath(obj: unknown, dotted: string): unknown {
  let cur: unknown = obj;
  for (const part of dotted.split(".")) {
    if (!isPlain(cur)) return undefined;
    cur = cur[part];
  }
  return cur;
}

function setPath(obj: PlainObject, dotted: string, value: unknown): void {
  const parts = dotted.split(".");
  let cur: PlainObject = obj;
  for (const part of parts.slice(0, -1)) {
    if (!isPlain(cur[part])) return;
    cur = cur[part] as PlainObject;
  }
  cur[parts[parts.length - 1]] = value;
}

export function maskSecrets(settings: AppSettings): AppSettings {
  const clone = JSON.parse(JSON.stringify(settings)) as AppSettings;
  for (const p of SECRET_PATHS) {
    const v = getPath(clone, p);
    setPath(clone as unknown as PlainObject, p, v ? KEEP_SENTINEL : "");
  }
  return clone;
}

function resolveSentinels(merged: PlainObject, current: AppSettings): void {
  for (const p of SECRET_PATHS) {
    if (getPath(merged, p) === KEEP_SENTINEL) {
      setPath(merged, p, getPath(current, p) ?? "");
    }
  }
}

async function readDb(): Promise<AppSettings> {
  const row = await db.query.appSetting.findFirst({
    where: eq(appSetting.id, 1),
  });
  return deepMerge(DEFAULT_SETTINGS, row?.value ?? {});
}

async function loadSettings(): Promise<AppSettings> {
  if (process.env.NEXT_PHASE === "phase-production-build") {
    return DEFAULT_SETTINGS;
  }

  const cached = await cacheGet(CACHE_KEY);
  if (cached) {
    try {
      const merged = deepMerge(DEFAULT_SETTINGS, JSON.parse(cached));
      if (merged.system.enableCaching) return merged;
    } catch {}
  }

  try {
    const merged = await readDb();
    if (merged.system.enableCaching) {
      await cacheSet(CACHE_KEY, JSON.stringify(merged), 60);
    }
    return merged;
  } catch (error) {
    console.warn("Failed to load settings from database, falling back to DEFAULT_SETTINGS.", error);
    return DEFAULT_SETTINGS;
  }
}

export const getSettings = cache(loadSettings);

export const readSettingsNoStore = readDb;

export async function saveSettings(
  patch: unknown,
): Promise<{ ok: true; settings: AppSettings } | { error: string }> {
  const current = await readDb();
  const merged = deepMerge(current, patch) as unknown as PlainObject;
  resolveSentinels(merged, current);
  const parsed = settingsSchema(merged);
  if (parsed instanceof type.errors) return { error: parsed.summary };
  await db
    .insert(appSetting)
    .values({ id: 1, value: parsed, updatedAt: new Date() })
    .onConflictDoUpdate({
      target: appSetting.id,
      set: { value: parsed, updatedAt: new Date() },
    });
  try {
    await redis.del(CACHE_KEY);
    await cacheSet(CACHE_KEY, JSON.stringify(parsed), 60);
  } catch {}
  return { ok: true, settings: parsed as AppSettings };
}
