import assert from "node:assert";
import { ALLOWED, ALLOWED_VIDEO, sniffImageMime, sniffMediaMime } from "../app/api/uploads/route";

const PNG = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
const JPEG = Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10]);
const GIF = Buffer.from([0x47, 0x49, 0x46, 0x38, 0x39, 0x61]);
const WEBP = Buffer.concat([
  Buffer.from("RIFF", "latin1"),
  Buffer.from([0x00, 0x00, 0x00, 0x00]),
  Buffer.from("WEBP", "latin1"),
]);
const SVG = Buffer.from("<svg xmlns=", "latin1");
const HTML = Buffer.from("<!doctype html>", "latin1");

function main() {
  assert(sniffImageMime(PNG) === "image/png", "PNG dikenali");
  assert(sniffImageMime(JPEG) === "image/jpeg", "JPEG dikenali");
  assert(sniffImageMime(GIF) === "image/gif", "GIF dikenali");
  assert(sniffImageMime(WEBP) === "image/webp", "WEBP dikenali");

  assert(sniffImageMime(SVG) === null, "SVG ditolak (bukan whitelist)");
  assert(sniffImageMime(HTML) === null, "HTML polos ditolak");
  assert(sniffImageMime(Buffer.alloc(0)) === null, "buffer kosong ditolak");

  const sniffed = sniffImageMime(JPEG);
  assert(sniffed !== null && sniffed !== "image/png", "mismatch header terdeteksi");

  for (const [mime, ext] of Object.entries({ ...ALLOWED, ...ALLOWED_VIDEO })) {
    assert(/^[a-z0-9]{1,5}$/.test(ext), `ext aman untuk ${mime}`);
  }

  const MP4 = Buffer.concat([
    Buffer.from([0x00, 0x00, 0x00, 0x18]),
    Buffer.from("ftypmp42", "latin1"),
  ]);
  const WEBM = Buffer.from([0x1a, 0x45, 0xdf, 0xa3, 0x00]);
  const MP3 = Buffer.from([0x49, 0x44, 0x33, 0x04, 0x00]);
  assert(sniffMediaMime(MP4) === "video/mp4", "MP4 dikenali");
  assert(sniffMediaMime(WEBM) === "video/webm", "WEBM dikenali");
  assert(sniffMediaMime(MP3) === "audio/mpeg", "MP3 dikenali");
  assert(sniffMediaMime(HTML) === null, "HTML ditolak sbg media");

  console.log("check-uploads: SEMUA ASSERT LOLOS ✔");
  process.exit(0);
}

main();
