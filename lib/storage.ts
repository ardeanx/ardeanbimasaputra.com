import { randomBytes } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

const ROOT = path.join(process.cwd(), "public", "uploads");

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
  await mkdir(ROOT, { recursive: true });
  const key = `${Date.now()}-${randomBytes(6).toString("hex")}.${ext}`;
  await writeFile(path.join(ROOT, key), data);
  return { url: `/uploads/${key}`, key };
}

const PRIVATE_ROOT = path.join(process.cwd(), "storage", "resources");

export async function putPrivate(data: Buffer, ext: string): Promise<{ key: string }> {
  await mkdir(PRIVATE_ROOT, { recursive: true });
  const suffix = ext ? `.${ext.replace(/[^a-z0-9]/gi, "").slice(0, 10)}` : "";
  const key = `${Date.now()}-${randomBytes(8).toString("hex")}${suffix}`;
  await writeFile(path.join(PRIVATE_ROOT, key), data);
  return { key };
}

export function privatePath(key: string): string {
  return path.join(PRIVATE_ROOT, path.basename(key));
}
