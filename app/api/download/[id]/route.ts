import { createReadStream } from "node:fs";
import { stat } from "node:fs/promises";
import { Readable } from "node:stream";
import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { resourceFile } from "@/db/schema";
import { db } from "@/lib/db";
import { canDownload } from "@/lib/resources";
import { getSession } from "@/lib/session";
import { privatePath } from "@/lib/storage";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const f = await db.query.resourceFile.findFirst({
    where: eq(resourceFile.id, id),
    with: { post: true, product: true },
  });
  if (!f) {
    return NextResponse.json({ error: "Berkas tidak ditemukan." }, { status: 404 });
  }

  const session = await getSession();
  const viewer = session
    ? {
        id: session.user.id,
        role: (session.user as { role?: string | null }).role ?? null,
      }
    : null;

  const allowed = await canDownload(viewer, {
    post: f.post,
    product: f.product,
  });
  if (!allowed) {
    return NextResponse.json(
      { error: session ? "Perlu membeli untuk mengunduh." : "Masuk untuk mengunduh." },
      { status: session ? 403 : 401 },
    );
  }

  const filePath = privatePath(f.storageKey);
  try {
    await stat(filePath);
  } catch {
    return NextResponse.json({ error: "Berkas hilang." }, { status: 404 });
  }

  const safeName = f.filename.replace(/[^\x20-\x7e]/g, "_").replace(/"/g, "");
  const stream = Readable.toWeb(createReadStream(filePath)) as unknown as ReadableStream;
  return new Response(stream, {
    headers: {
      "Content-Type": "application/octet-stream",
      "Content-Disposition": `attachment; filename="${safeName}"`,
      "Content-Length": String(f.size),
    },
  });
}
