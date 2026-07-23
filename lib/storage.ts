import { del as delBlob, put as putBlob } from "@vercel/blob";
import { randomBytes } from "node:crypto";
import { mkdir, unlink, writeFile } from "node:fs/promises";
import path from "node:path";

const ROOT = path.join(process.cwd(), "public", "uploads");
const PRIVATE_ROOT = path.join(process.cwd(), "storage", "resources");
const CAN_USE_BLOB = Boolean(process.env.BLOB_READ_WRITE_TOKEN);

const EXT: Record<string, string> = {
  "image/png": "png",
  "image/jpeg": "jpg",
  "image/webp": "webp",
  "image/gif": "gif",
};

export function extForMime(mime: string): string | null {
  return EXT[mime] ?? null;
}

export async function put(data: Buffer, ext: string): Promise<{ url: string; key: string }> {
  const key = `${Date.now()}-${randomBytes(6).toString("hex")}.${ext}`;

  if (CAN_USE_BLOB) {
    const blob = await putBlob(key, data, { access: "public" });
    return { url: blob.url, key: blob.pathname };
  }

  if (process.env.VERCEL) {
    throw new Error(
      "Upload storage belum dikonfigurasi untuk Vercel. Set env BLOB_READ_WRITE_TOKEN di Project Settings → Storage, lalu hubungkan Blob store.",
    );
  }

  await mkdir(ROOT, { recursive: true });
  await writeFile(path.join(ROOT, key), data);
  return { url: `/uploads/${key}`, key };
}

export async function putPrivate(data: Buffer, ext: string): Promise<{ key: string }> {
  if (process.env.VERCEL) {
    throw new Error(
      "Private resource storage is not configured for Vercel. Use a persistent blob or file store for private downloads.",
    );
  }

  await mkdir(PRIVATE_ROOT, { recursive: true });
  const suffix = ext ? `.${ext.replace(/[^a-z0-9]/gi, "").slice(0, 10)}` : "";
  const key = `${Date.now()}-${randomBytes(8).toString("hex")}${suffix}`;
  await writeFile(path.join(PRIVATE_ROOT, key), data);
  return { key };
}

export async function remove(key: string): Promise<void> {
  if (CAN_USE_BLOB) {
    await delBlob(key);
    return;
  }

  if (process.env.VERCEL) {
    throw new Error(
      "Upload storage is not configured for Vercel. Set BLOB_READ_WRITE_TOKEN in environment variables.",
    );
  }

  try {
    await unlink(path.join(ROOT, path.basename(key)));
  } catch {
    // ignore missing files during hard-delete cleanup
  }
}

export function privatePath(key: string): string {
  return path.join(PRIVATE_ROOT, path.basename(key));
}
