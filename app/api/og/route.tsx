import { eq } from "drizzle-orm";
import { ImageResponse } from "next/og";
import { post } from "@/db/schema";
import { db } from "@/lib/db";
import { bodyText } from "@/lib/format";
import { getSettings } from "@/lib/settings";

export const runtime = "nodejs";

export async function GET(req: Request) {
  const s = await getSettings();
  const brand = s.system.appName;
  const v = new URL(req.url).searchParams.get("v");
  let title = s.seo.siteTitle;
  let subtitle = s.seo.siteDescription;
  let author = "";
  if (v) {
    const p = await db.query.post.findFirst({
      where: eq(post.id, v),
      with: { author: true },
    });
    if (p && p.status === "PUBLISHED" && p.visibility !== "PRIVATE") {
      title = p.title;
      subtitle = bodyText(p.body).slice(0, 120);
      author = p.author.name;
    }
  }

  return new ImageResponse(
    <div
      style={{
        height: "100%",
        width: "100%",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        background: "#0f0f0f",
        color: "#f1f1f1",
        padding: 72,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
        <div
          style={{
            width: 56,
            height: 40,
            background: "#065fd4",
            borderRadius: 10,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "#ffffff",
            fontSize: 28,
            fontWeight: 800,
          }}
        >
          {brand.charAt(0).toUpperCase()}
        </div>
        <div style={{ fontSize: 32, fontWeight: 700 }}>{brand}</div>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
        <div
          style={{
            display: "flex",
            fontSize: 64,
            fontWeight: 800,
            lineHeight: 1.1,
          }}
        >
          {title.slice(0, 90)}
        </div>
        {subtitle && (
          <div style={{ display: "flex", fontSize: 30, color: "#aaaaaa" }}>{subtitle}</div>
        )}
      </div>

      <div style={{ display: "flex", fontSize: 28, color: "#3ea6ff" }}>{author}</div>
    </div>,
    { width: 1200, height: 630 },
  );
}
