import { randomBytes } from "node:crypto";
import { eq } from "drizzle-orm";
import { auth } from "../lib/auth";
import { db } from "../lib/db";
import { category, post, product, user } from "./schema";

const videoId = () => randomBytes(8).toString("base64url");

const TYPES = ["VIDEO", "AUDIO", "POST", "RESOURCE"] as const;

const seedSlug = (s: string) =>
  s
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 60);

const PASSWORD = "password123";

const USERS = [
  {
    name: "Ardean Bima Saputra",
    username: "ardean",
    email: "ardeanbimasaputra@gmail.com",
    admin: true,
  },
  { name: "Sinta Dewi", username: "sintadev", email: "sinta@example.com", admin: false },
  { name: "Budi Hartono", username: "budihartono", email: "budi@example.com", admin: false },
  { name: "Rani Pratiwi", username: "ranicodes", email: "rani@example.com", admin: false },
  { name: "Joko Prasetyo", username: "jokodev", email: "joko@example.com", admin: false },
];

const CATEGORIES = [
  { name: "Web", slug: "web" },
  { name: "Mobile", slug: "mobile" },
  { name: "DevOps", slug: "devops" },
  { name: "UI/UX", slug: "ui-ux" },
  { name: "Database", slug: "database" },
  { name: "Karier", slug: "karier" },
];

const TITLES = [
  "Membangun REST API dengan Next.js Route Handlers",
  "Drizzle ORM: Migrasi dari Prisma Tanpa Drama",
  "Server Components vs Client Components — Kapan Pakai Apa",
  "Deploy Next.js ke VPS Tanpa Docker",
  "Autentikasi Modern dengan Better Auth",
  "Tailwind v4: Fitur Baru yang Wajib Kamu Tahu",
  "Optimasi Query PostgreSQL untuk Feed Konten",
  "Redis untuk Rate Limiting di Next.js",
  "State Management 2026: Masih Perlu Zustand?",
  "Membuat Design System ala YouTube",
  "TypeScript Strict Mode: Panduan Bertahan Hidup",
  "pgvector: Semantic Search di PostgreSQL",
  "Streaming SSR dan Suspense di App Router",
  "Monorepo vs Polyrepo untuk Solo Developer",
  "Webhook Midtrans: Pola yang Aman",
  "File Upload Aman di Next.js",
  "Kenapa Saya Pindah ke ArkType",
  "CI/CD Sederhana dengan GitHub Actions",
  "Caching Berlapis: CDN, Redis, dan React Cache",
  "Clean Architecture Itu Overrated? Sebuah Refleksi",
  "Membaca Source Code Library Favoritmu",
  "Dark Mode Tanpa Flash of Wrong Theme",
  "Negosiasi Gaji untuk Developer Indonesia",
  "Portofolio Developer yang Dilirik Recruiter",
];

const body = (title: string) => ({
  type: "doc",
  content: [
    {
      type: "paragraph",
      content: [
        {
          type: "text",
          text: `${title} — ini konten seed untuk memvalidasi shell YouTube di Fase 1. Isi artikel sungguhan ditulis lewat editor Tiptap di Studio (Fase 2).`,
        },
      ],
    },
  ],
});

async function main() {
  for (const u of USERS) {
    const exists = await db.query.user.findFirst({
      where: eq(user.email, u.email),
    });
    if (!exists) {
      await auth.api.signUpEmail({
        body: { email: u.email, password: PASSWORD, name: u.name, username: u.username },
      });
      console.log(`user dibuat: ${u.username}`);
    }
    await db
      .update(user)
      .set({
        role: u.admin ? "admin" : "member",
        emailVerified: true,
        image: `https://i.pravatar.cc/150?u=${u.username}`,
        bio: `Halo, saya ${u.name}.`,
      })
      .where(eq(user.email, u.email));
  }

  await db.insert(category).values(CATEGORIES).onConflictDoNothing();

  const existing = await db.$count(post);
  if (existing > 0) {
    console.log(`posts sudah ada (${existing}), lewati`);
  } else {
    const users = await db.select().from(user);
    const cats = await db.select().from(category);
    const now = Date.now();

    await db.insert(post).values(
      TITLES.map((title, i) => {
        const type = TYPES[i % TYPES.length];
        return {
          id: videoId(),
          type,
          status: "PUBLISHED" as const,
          title,
          slug: `${seedSlug(title)}-${i}`,
          body: body(title),
          thumbnail: `https://picsum.photos/seed/ardean-${i}/640/360`,
          readTime: 3 + (i % 10),
          durationSec: type === "VIDEO" || type === "AUDIO" ? 120 + i * 37 : null,
          viewCount: Math.floor(Math.random() * 250_000),
          authorId: users[i % users.length].id,
          categoryId: cats[i % cats.length].id,
          publishedAt: new Date(now - i * 36 * 60 * 60 * 1000),
        };
      }),
    );
    console.log(`${TITLES.length} posts dibuat`);
  }

  const productCount = await db.$count(product);
  if (productCount === 0) {
    const admin = await db.query.user.findFirst({
      where: eq(user.email, USERS[0].email),
    });
    if (admin) {
      await db.insert(product).values([
        {
          id: videoId(),
          ownerId: admin.id,
          title: "Starter Kit Next.js + Drizzle",
          slug: "starter-kit-next-drizzle",
          description: "Boilerplate produksi: auth, ORM, dan CI siap pakai.",
          kind: "SOURCE_CODE" as const,
          status: "PUBLISHED" as const,
          price: 150_000,
          thumbnail: "https://picsum.photos/seed/ardean-product-1/640/360",
        },
        {
          id: videoId(),
          ownerId: admin.id,
          title: "Pack Ikon UI (gratis)",
          slug: "pack-ikon-ui-gratis",
          description: "200+ ikon SVG untuk dashboard.",
          kind: "DIGITAL" as const,
          status: "PUBLISHED" as const,
          price: 0,
          thumbnail: "https://picsum.photos/seed/ardean-product-2/640/360",
        },
      ]);
      console.log("2 produk dibuat");
    }
  }

  console.log("Seed selesai ✔");
  process.exit(0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
