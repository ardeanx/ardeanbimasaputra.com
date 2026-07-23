# Ardean CMS — Blueprint

> Platform personal branding full-stack Next.js dengan desain shell YouTube (aksen biru).
> Dokumen ini adalah acuan hidup — setiap keputusan baru dicatat di sini.

**Status:** Fase 0–6 selesai (2026-07-20). Enam fase inti rampung. Sisa = backlog §10 (fitur lanjutan).

- Fase 3-finish: feed **Baca nanti** (bookmark), **Riwayat** (post_view), **Disukai** (like) nyata; Playlist tetap backlog (§10).
- Fase 4: **resource_file** (versi + sha256 + storageKey) & **entitlement**; storage **privat di luar /public**; `/api/resources` (upload owner-only), `/api/download/[id]` (stream + gating `canDownload`: gratis=login, berbayar=author/admin/entitlement). ResourceManager (editor), ResourceDownloads (watch, lock berbayar). `grantEntitlement` sudah ada (dipakai webhook Fase 5); belum ter-expose ke user.
- Terverifikasi: check-phase4 (sha256 integritas disk, versioning, semua kasus gating) + check-phase3 regresi LOLOS.
- Fase 2: Studio CRUD, moderasi admin, view counter Redis, editor Tiptap→**editor Notion/Gutenberg** (BlockEditor: slash menu + bubble menu, RightPanel WordPress, doc-title), **upload media** (lib/storage lokal→R2, /api/uploads dgn magic-byte sniffing, MediaPicker), highlight **Shiki** server-side.
- **Studio redesign** meniru layout YouTube Studio: StudioShell/Topbar/Nav (avatar header, icon nav role-aware), Dashboard (kartu performa/moderasi/analitik/teratas), /studio/content.
- Fase 3: **comment** (threaded 1 tingkat) + **like** + **follow/subscribe** + **notification** (COMMENT/REPLY/FOLLOW/APPROVED/REJECTED/NEW_CONTENT fan-out). lib/community + lib/notifications; UI di watch (Comments/LikeButton/SubscribeButton), channel, Header NotificationBell, feed subscriptions.
- Terverifikasi: check-uploads + check-phase3 assert LOLOS (DB nyata), typecheck+lint bersih, nol komentar. Smoke HTTP live terhambat latensi Supabase Paris (lihat §11).
- Belum: analitik nyata, monetisasi/kustomisasi/setelan (stub nav), feed liked/history, komentar realtime.

ATURAN KODE: dilarang keras komentar dalam bentuk apa pun (lihat CLAUDE.md). Backend count-on-read; kolom `post.likeCount`/`comment.likeCount` ada tapi tak dipakai (kandidat cleanup).

---

## 1. Visi & Prinsip

1. **Desain YouTube = hukum tertinggi.** Shell di-clone 100% dari youtube.com (diukur live, bukan dari ingatan), warna merah diganti biru. Fase 1 = shell pixel-perfect disetujui dulu, fitur menyusul.
2. **Tidak ada MVP** — semua fitur dibangun penuh, tapi berurutan per fase supaya tiap lapis teruji.
3. **YouTube sebagai model UX, bukan cuma kulit** — konsep YouTube dipetakan 1:1 ke konsep CMS (lihat §3).
4. Tanpa asumsi: keputusan dicatat eksplisit di §2 dan §11.

## 2. Keputusan Terkunci (ronde 1 + revisi — 2026-07-20)

| #   | Keputusan          | Pilihan                                                                                                                                              |
| --- | ------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | Mesin CMS          | **Custom penuh** (Next.js + Drizzle, tanpa Payload) — panel Studio ikut di-clone dari YouTube Studio                                                 |
| 2   | Database           | **Supabase** (managed PostgreSQL) — dipakai **murni sebagai database**; auth & storage TIDAK pakai layanan Supabase                                  |
| 3   | Toko               | **Produk digital saja** + **Midtrans Snap** (QRIS, e-wallet, VA, kartu; sandbox dulu)                                                                |
| 4   | User content       | **Semua member boleh menulis, wajib moderasi** — status REVIEW → approve admin → PUBLISHED                                                           |
| 5   | ORM                | **Drizzle** + drizzle-kit (migrasi)                                                                                                                  |
| 6   | Validasi           | **ArkType** (Standard Schema; `drizzle-arktype` untuk derive dari schema DB)                                                                         |
| 7   | Search             | **Hybrid**: Postgres FTS/trigram untuk search bar + **pgvector** untuk semantic & "konten terkait" (built-in di Supabase; model embedding → ronde 2) |
| 8   | Cache & rate-limit | **Redis** (Redis 5 Laragon lokal → managed Redis saat deploy)                                                                                        |
| 9   | Infra dev          | **Tanpa Docker** — konsekuensi: dev konek langsung ke project Supabase cloud (free tier), karena Supabase CLI lokal butuh Docker                     |

## 3. Pemetaan UX YouTube → Ardean CMS

| YouTube                       | Ardean CMS                                                                                      |
| ----------------------------- | ----------------------------------------------------------------------------------------------- |
| Video di grid beranda         | Konten (artikel / resource / produk) — kartu thumbnail 16:9                                     |
| Watch page `/watch?v=…`       | Halaman baca konten + sidebar "terkait" + komentar                                              |
| Channel `/@handle`            | Profil publik user — tab Home · Post · Resource · About                                         |
| Subscribe                     | Follow creator → feed Subscriptions                                                             |
| **YouTube Studio**            | **Studio** = panel CMS (kelola konten, komentar, file); admin = Studio + menu ekstra role-gated |
| Create (+)                    | "Buat" → tulis konten / upload resource                                                         |
| History · Watch later · Liked | Riwayat baca · Baca nanti · Disukai                                                             |
| Bell                          | Notifikasi (komentar, approval, pembelian, konten baru)                                         |
| Badge durasi thumbnail        | Estimasi waktu baca / badge harga                                                               |
| Explore / Trending            | Jelajah per kategori + Toko                                                                     |

URL ikut di-clone: `/watch?v=<11 karakter>`, `/@handle`, `/feed/subscriptions`, `/results?search_query=`.

## 4. Tech Stack

| Lapisan          | Pilihan                                                           | Catatan                                                                                                               |
| ---------------- | ----------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------- |
| Framework        | Next.js App Router + TypeScript strict                            | Versi terbaru dikunci saat scaffold                                                                                   |
| Styling          | Tailwind CSS v4 + komponen 100% custom                            | Tanpa component library di shell — musuh pixel-perfect                                                                |
| Font & ikon      | Roboto (next/font) + Material Symbols Outlined                    | Persis YouTube                                                                                                        |
| Tema             | next-themes                                                       | Dark/light ala YouTube                                                                                                |
| Database         | Supabase (managed PostgreSQL)                                     | Murni sebagai DB. Koneksi app via pooler (port 6543, `prepare: false`); migrasi drizzle-kit via koneksi direct (5432) |
| ORM              | Drizzle + drizzle-kit                                             | Driver `postgres` (postgres-js); ringan, SQL-first                                                                    |
| Auth             | Better Auth (adapter Drizzle)                                     | Plugin: admin (ban/impersonate), username, 2FA opsional                                                               |
| Editor           | Tiptap (body = JSON) + Shiki                                      | Code block first-class                                                                                                |
| Validasi         | ArkType                                                           | Standard Schema — kompatibel Better Auth & react-hook-form                                                            |
| File storage     | Disk lokal (dev) → S3-compatible/Cloudflare R2 (deploy)           | Interface kecil: put/get/delete/url. R2 egress gratis untuk zip                                                       |
| Email            | Mailpit (lokal) → Resend/SMTP                                     | Verifikasi akun, kuitansi                                                                                             |
| Pembayaran       | Midtrans Snap                                                     | Keputusan #3; sandbox dulu                                                                                            |
| Search           | Postgres FTS/`pg_trgm` (search bar) + pgvector (semantic/terkait) | pgvector tinggal di-enable di Supabase; butuh model embedding → ronde 2                                               |
| Cache/rate-limit | Redis (`ioredis`)                                                 | Lokal: Redis 5 Laragon. Untuk cache query panas, dedup view counter, rate limit                                       |

## 5. DNA Desain (angka awal — final diukur live dari youtube.com)

| Elemen     | Spec                                                                                                                                           |
| ---------- | ---------------------------------------------------------------------------------------------------------------------------------------------- |
| Header     | 56px: hamburger · logo · search pill 40px radius penuh (tombol kaca 64px) · Buat (+) · bell · avatar 32                                        |
| Sidebar    | 240px expanded / 72px mini-guide; item 40px radius 8                                                                                           |
| Kartu      | Thumb 16:9 radius 12 · avatar 36 · judul Roboto 500 16/22 max 2 baris · meta 14px `#606060`                                                    |
| Chips      | 32px, radius 8, `#f2f2f2`, aktif hitam, sticky di bawah header                                                                                 |
| Terang     | bg `#fff` · teks `#0f0f0f` · sekunder `#606060`                                                                                                |
| Gelap      | bg `#0f0f0f` · surface `#212121`/`#272727` · teks `#f1f1f1` · sekunder `#aaa`                                                                  |
| Merah→Biru | Logo, progress bar, badge notif, LIVE → skala biru. CTA YouTube sudah biru (`#065fd4`, dark `#3ea6ff`); Subscribe modern hitam — dipertahankan |
| Breakpoint | ≥1312 sidebar penuh · ≥792 mini · <792 drawer + bottom bar                                                                                     |

Metode validasi: buka youtube.com di browser pane → inspect computed styles → tokens → screenshot side-by-side sampai ≈ identik → approval user.

## 6. Struktur Route

```
app/
├─ (shell)/                    ← layout YouTube (header + sidebar)
│  ├─ page.tsx                 Beranda: grid + chips
│  ├─ watch/                   /watch?v=XXXXXXXXXXX
│  ├─ [handle]/                /@ardean (validasi prefix @)
│  ├─ feed/subscriptions       Feed follow
│  ├─ feed/history · playlist  Riwayat · Baca nanti · Disukai
│  ├─ results/                 /results?search_query=…
│  ├─ store/                   Grid produk + detail
│  └─ c/[kategori]/            Jelajah kategori
├─ (studio)/studio/            ← layout YouTube Studio (CMS)
│  └─ role-gated:              Moderasi · Pengguna · Pesanan · Kategori · Pengaturan
├─ (auth)/login · register
└─ api/
   ├─ webhooks/midtrans        Verifikasi signature → settle → Entitlement
   ├─ download/[token]         Cek Entitlement → stream file (di luar /public)
   └─ uploads/
```

## 7. Model Domain

```
AUTH       User · Session · Account · Verification        (tabel Better Auth)
PROFIL     handle · avatar · banner · bio · role (ADMIN | MEMBER) · Follow
KONTEN     Post { type: ARTICLE | RESOURCE,
                  status: DRAFT | REVIEW | PUBLISHED | REJECTED | ARCHIVED,
                  videoId (11 char), body (Tiptap JSON), thumbnail, readTime,
                  price (null = bukan jualan · 0 = gratis · >0 = tampil di Toko) }
           Category · Tag
RESOURCE   ResourceFile { postId, version, filename, size, sha256, storagePath }
INTERAKSI  Comment (threaded) · Like · View (dedup user/IP/hari) · Bookmark · History
TOKO       Order · OrderItem · Payment (ref Midtrans, raw webhook) · Entitlement
MEDIA      MediaFile { uploader, path, mime, size }
SISTEM     Notification · SiteSetting · StaticPage
```

Resource = Post bertipe RESOURCE dengan file + harga. Toko = filter `price > 0`. Satu model, tiga wajah. Model Product terpisah baru dibuat kalau jual barang non-konten.

## 8. Keamanan (tidak boleh malas di sini)

- File berbayar di luar `/public`; download via route ber-token + cek Entitlement.
- Webhook Midtrans diverifikasi signature-key; status order hanya berubah dari webhook, bukan redirect.
- Semua input lewat Zod; konten member selalu melewati REVIEW (keputusan #4).
- Rate limit login/register.
- Password/secret tidak pernah masuk repo — `.env` di-gitignore sejak commit pertama.

## 9. Fase Pengerjaan

| Fase | Isi                                                                                           | Bukti selesai                                                      |
| ---- | --------------------------------------------------------------------------------------------- | ------------------------------------------------------------------ |
| 0    | Scaffold Next+TS+Tailwind, git init, Drizzle+Supabase, wrapper Redis, Better Auth, seed dummy | Login jalan, seed tampil                                           |
| 1    | **Shell YouTube** (diukur live): header, sidebar, chips, grid, watch, channel, dark/light     | Screenshot side-by-side ≈ identik, user approve                    |
| 2    | Konten inti: CRUD Studio, Tiptap+Shiki, media, kategori, view counter                         | Tulis → publish → baca → view naik                                 |
| 3 ✓  | Komunitas: komentar, like, follow, notifikasi + feed Baca nanti/Riwayat/Disukai               | SELESAI                                                            |
| 4 ✓  | Resource: file + versi + sha256, download gating (privat + entitlement)                       | SELESAI                                                            |
| 5 ✓  | Toko: Order → Snap → webhook/status-API → grantEntitlement → kuitansi                         | SELESAI (butuh key Midtrans sandbox di .env untuk transaksi nyata) |
| 6 ✓  | Analitik Studio (tayangan/subscriber/suka/komentar, seri 28 hari, konten teratas)             | SELESAI                                                            |
| 7+   | Backlog §10: newsletter, kupon, membership, i18n, SEO/OG, GitHub, pgvector, dsb.              | —                                                                  |

## 10. Backlog — Ronde Diskusi 2

SELESAI: ~~analytics Studio~~ (Fase 6) · ~~koleksi/playlist~~ · ~~SEO + OG image generator~~ · ~~kupon/diskon~~ (lib/coupons, /studio/coupons, popover checkout) · ~~integrasi GitHub~~ (impor zipball repo publik jadi resource).

DIAKTIFKAN user, menunggu detail/kunci untuk dikerjakan:

- newsletter & broadcast → provider email (Resend API key ATAU SMTP host/user/pass).
- pgvector semantic search → model embedding (OpenAI/Gemini API key ATAU model lokal).
- membership langganan → struktur tier + harga + Midtrans recurring.
  Sisa lain: backup DB (skrip/cron) · Snippets · i18n ID/EN · marketplace multi-penjual · target deploy.

## 11. Catatan Environment

- Folder proyek: `C:\laragon\www\ardean-cms` (Laragon hanya untuk Redis-nya; Next.js jalan dengan dev server sendiri di port 3000, lokasi folder tidak masalah).
- Database: project Supabase cloud (free tier) — tidak ada DB lokal, tidak ada Docker. Prasyarat Fase 0: buat project di supabase.com, salin connection string (pooler + direct) ke `.env`.
- Laragon: Redis 5 ✓ (dipakai cache/rate-limit) · MySQL 9.6 ✓ (tidak dipakai proyek ini).
- Runtime & package manager: **bun** (`bun.lock`); Next.js 16.2.10; dev server `bun run dev` port 3000.
- PENTING: karakter spesial di password DB (`#`, `@`, dll.) wajib di-URL-encode di connection string (`#`→`%23`, `@`→`%40`).
- `lib/db.ts` memakai singleton client + `max: 5` — wajib agar hot-reload dev tidak menumpuk koneksi sampai limit pooler Supabase (EMAXCONN 200).
- Project Supabase di **eu-west-3 (Paris)** — latensi tinggi dari Indonesia; di bawah beban konkuren (skrip cek + dev server) muncul `statement timeout`/stall pada halaman yang melakukan beberapa query berurutan. SANGAT disarankan pindah project ke ap-southeast-1 (Singapura). Ini isu infra, bukan bug kode.
- Analitik (lib/analytics.ts) mengasumsikan session timezone DB = UTC (default Supabase) agar bucket harian cocok dengan kunci UTC di JS. Jika deploy ke DB non-UTC, samakan ke UTC atau ubah kolom ke timestamptz.
- Pembayaran: webhook Midtrans hanya memakai body untuk verifikasi signature, lalu **re-fetch status via Status API** (syncOrder) sebagai sumber kebenaran (best practice Midtrans; juga jalan di dev tanpa tunnel via tombol "Perbarui status"). Refund/chargeback mencabut entitlement.
- Belum git repo — `git init` di Fase 0.
- Plugin Prisma di sesi Claude tidak lagi relevan (kita pakai Drizzle) — abaikan.
