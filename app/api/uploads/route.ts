import { NextResponse } from "next/server";
import { mediaFile } from "@/db/schema";
import { db } from "@/lib/db";
import { genId } from "@/lib/id";
import { getSession } from "@/lib/session";
import { getSettings } from "@/lib/settings";
import { put, remove } from "@/lib/storage";

export const ALLOWED: Record<string, string> = {
  "image/png": "png",
  "image/jpeg": "jpg",
  "image/webp": "webp",
  "image/gif": "gif",
  "image/x-icon": "ico",
};

export const ALLOWED_VIDEO: Record<string, string> = {
  "video/mp4": "mp4",
  "video/webm": "webm",
  "audio/mpeg": "mp3",
};

export function sniffMediaMime(buf: Buffer): string | null {
  if (buf.length >= 12 && buf.toString("latin1", 4, 8) === "ftyp") return "video/mp4";
  if (buf.length >= 4 && buf[0] === 0x1a && buf[1] === 0x45 && buf[2] === 0xdf && buf[3] === 0xa3)
    return "video/webm";
  if (
    buf.length >= 3 &&
    ((buf[0] === 0x49 && buf[1] === 0x44 && buf[2] === 0x33) ||
      (buf[0] === 0xff && (buf[1] & 0xe0) === 0xe0))
  )
    return "audio/mpeg";
  return null;
}

export function sniffImageMime(buf: Buffer): string | null {
  if (buf.length >= 8 && buf[0] === 0x89 && buf[1] === 0x50 && buf[2] === 0x4e && buf[3] === 0x47)
    return "image/png";
  if (buf.length >= 3 && buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) return "image/jpeg";
  if (buf.length >= 6 && buf[0] === 0x47 && buf[1] === 0x49 && buf[2] === 0x46 && buf[3] === 0x38)
    return "image/gif";
  if (
    buf.length >= 12 &&
    buf.toString("latin1", 0, 4) === "RIFF" &&
    buf.toString("latin1", 8, 12) === "WEBP"
  )
    return "image/webp";
  if (buf.length >= 4 && buf[0] === 0x00 && buf[1] === 0x00 && buf[2] === 0x01 && buf[3] === 0x00)
    return "image/x-icon";
  return null;
}

export async function POST(req: Request) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Harus masuk." }, { status: 401 });
  }

  const s = await getSettings();
  const maxBytes = s.system.maxUploadMb * 1024 * 1024;

  const form = await req.formData().catch(() => null);
  const file = form?.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "Berkas tidak ditemukan." }, { status: 400 });
  }
  if (file.size === 0 || file.size > maxBytes) {
    return NextResponse.json(
      { error: `Ukuran berkas tidak valid (maks ${s.system.maxUploadMb}MB).` },
      { status: 400 },
    );
  }

  let buffer = Buffer.from(await file.arrayBuffer());
  let sniffed = sniffImageMime(buffer);
  let ext = sniffed ? ALLOWED[sniffed] : undefined;
  if (!sniffed && s.system.allowVideoUpload) {
    sniffed = sniffMediaMime(buffer);
    ext = sniffed ? ALLOWED_VIDEO[sniffed] : undefined;
  }
  if (!sniffed || !ext) {
    return NextResponse.json(
      {
        error: s.system.allowVideoUpload
          ? "Tipe berkas tidak didukung (png, jpg, webp, gif, mp4, webm, mp3)."
          : "Tipe berkas tidak didukung (png, jpg, webp, gif).",
      },
      { status: 400 },
    );
  }
  const icoMimes = ["image/x-icon", "image/vnd.microsoft.icon"];
  const typeMismatch =
    file.type &&
    file.type !== sniffed &&
    !(sniffed === "image/x-icon" && icoMimes.includes(file.type));
  if (typeMismatch) {
    return NextResponse.json({ error: "Isi berkas tidak cocok dengan tipenya." }, { status: 400 });
  }

  if (s.system.autoOptimizeImage && (sniffed === "image/png" || sniffed === "image/jpeg")) {
    try {
      const sharp = (await import("sharp")).default;
      buffer = Buffer.from(await sharp(buffer).webp({ quality: 82 }).toBuffer());
      sniffed = "image/webp";
      ext = "webp";
    } catch {}
  }

  let stored: { url: string; key: string };
  try {
    stored = await put(buffer, ext);
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Gagal menyimpan berkas.";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
  const id = genId();
  try {
    await db.insert(mediaFile).values({
      id,
      uploaderId: session.user.id,
      url: stored.url,
      key: stored.key,
      mime: sniffed,
      size: buffer.length,
    });
  } catch (err) {
    try {
      await remove(stored.key);
    } catch {}
    const msg = err instanceof Error ? err.message : "Gagal mencatat metadata berkas.";
    return NextResponse.json({ error: msg }, { status: 500 });
  }

  return NextResponse.json({ id, url: stored.url }, { status: 201 });
}
