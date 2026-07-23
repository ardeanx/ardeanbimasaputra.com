import SplashScreen from "@/components/SplashScreen";
import { ImageZoomHost } from "@/components/content/ZoomImg";
import { ThemeProvider } from "@/components/theme-provider";
import DialogHost from "@/components/ui/dialog";
import { contrastText } from "@/lib/color";
import { getLocale } from "@/lib/i18n";
import { baseUrl, buildSiteJsonLd } from "@/lib/seo";
import { getSettings } from "@/lib/settings";
import "@aejkatappaja/phantom-ui/ssr.css";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import type { Metadata, Viewport } from "next";
import NextTopLoader from "nextjs-toploader";
import { Toaster } from "sonner";
import "./globals.css";

const FONT_STACKS: Record<string, string> = {
  system: 'ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, Arial, sans-serif',
  inter: '"Inter", ui-sans-serif, system-ui, sans-serif',
  roboto: '"Roboto", ui-sans-serif, system-ui, sans-serif',
  merriweather: '"Merriweather", ui-serif, Georgia, serif',
  "jetbrains-mono": '"JetBrains Mono", ui-monospace, monospace',
};

const FONT_LINKS: Record<string, string | null> = {
  system: null,
  inter: "https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap",
  roboto: "https://fonts.googleapis.com/css2?family=Roboto:wght@400;500;700&display=swap",
  merriweather: "https://fonts.googleapis.com/css2?family=Merriweather:wght@400;700&display=swap",
  "jetbrains-mono":
    "https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;700&display=swap",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: [
    { media: "(prefers-color-scheme: dark)", color: "#0f0f0f" },
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
  ],
};

export async function generateMetadata(): Promise<Metadata> {
  const s = await getSettings();
  const xSeg = s.seo.socials.x.trim().replace(/\/+$/, "").split("/").pop() ?? "";
  const xHandle = xSeg ? "@" + xSeg.replace(/^@+/, "") : null;
  return {
    metadataBase: new URL(baseUrl()),
    title: { default: s.seo.siteTitle, template: s.seo.titleTemplate },
    description: s.seo.siteDescription,
    robots: s.seo.allowIndexing ? undefined : { index: false, follow: false },
    icons: s.appearance.favicon ? { icon: s.appearance.favicon } : undefined,
    openGraph: {
      siteName: s.system.appName,
      type: "website",
      images: [s.seo.ogImage ?? "/api/og"],
    },
    twitter: {
      card: "summary_large_image",
      images: [s.seo.ogImage ?? "/api/og"],
      ...(xHandle ? { site: xHandle, creator: xHandle } : {}),
    },
  };
}

export default async function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const [s, locale] = await Promise.all([getSettings(), getLocale()]);
  const fontLink = FONT_LINKS[s.appearance.siteFont];
  const jsonLd = buildSiteJsonLd(s);
  return (
    <html
      lang={locale}
      suppressHydrationWarning
      style={
        {
          "--yt-cta": s.appearance.primaryColor,
          "--yt-cta-text": contrastText(s.appearance.primaryColor),
        } as React.CSSProperties
      }
    >
      <head>
        {fontLink && (
          <>
            <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
            <link rel="stylesheet" href={fontLink} />
          </>
        )}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(jsonLd).replaceAll("<", "\\u003c"),
          }}
        />
      </head>
      <body className="antialiased" style={{ fontFamily: FONT_STACKS[s.appearance.siteFont] }}>
        <ThemeProvider defaultTheme={s.appearance.defaultTheme}>
          <NextTopLoader
            color={s.appearance.primaryColor}
            height={3}
            showSpinner={false}
            shadow={`0 0 10px ${s.appearance.primaryColor}, 0 0 5px ${s.appearance.primaryColor}`}
          />
          {s.appearance.enableSplashScreen && (
            <SplashScreen appName={s.system.appName} logo={s.appearance.logo} />
          )}
          {children}
          <Toaster position="bottom-right" richColors theme="system" />
          <DialogHost />
          <ImageZoomHost />
          <Analytics />
          <SpeedInsights />
        </ThemeProvider>
      </body>
    </html>
  );
}
