import assert from "node:assert";
import { eq } from "drizzle-orm";
import { db } from "../lib/db";
import { getNotifPrefs, isNotifAllowed, saveNotifPrefs } from "../lib/notification-prefs";
import {
  deletePage,
  getPublishedPage,
  isReservedSlug,
  listFooterPages,
  savePage,
} from "../lib/pages";
import { deleteProduct, getPublicProductBySlug, saveProduct } from "../lib/products";
import { page, user } from "./schema";

async function main() {
  const admin = (await db.query.user.findFirst({
    where: eq(user.username, "ardean"),
  }))!;
  const member = (await db.query.user.findFirst({
    where: eq(user.username, "sintadev"),
  }))!;
  assert(admin && member, "seed user ada");

  assert(isReservedSlug("store"), "slug sistem reserved");
  assert(isReservedSlug("@ardean"), "handle reserved");
  assert(!isReservedSlug("tentang-kami"), "slug bebas boleh");

  const doc = {
    type: "doc",
    content: [{ type: "paragraph", content: [{ type: "text", text: "Halaman uji." }] }],
  };
  const draft = await savePage(admin.id, {
    slug: "cek-r3-page",
    title: "Cek R3 Page",
    body: doc,
    status: "DRAFT",
    showInFooter: true,
    sortOrder: 1,
  });
  assert("id" in draft, "savePage draft");
  assert((await getPublishedPage("cek-r3-page")) === null, "draft tidak publik");
  const pub = await savePage(admin.id, {
    id: draft.id,
    slug: "cek-r3-page",
    title: "Cek R3 Page",
    body: doc,
    status: "PUBLISHED",
    showInFooter: true,
    sortOrder: 1,
  });
  assert("id" in pub, "publish page");
  const got = await getPublishedPage("cek-r3-page");
  assert(got?.title === "Cek R3 Page", "getPublishedPage setelah publish");
  const footer = await listFooterPages();
  assert(
    footer.some((p) => p.slug === "cek-r3-page"),
    "listFooterPages memuat halaman",
  );
  const reserved = await savePage(admin.id, {
    slug: "store",
    title: "X",
    body: doc,
    status: "DRAFT",
    showInFooter: false,
    sortOrder: 0,
  });
  assert("error" in reserved, "savePage slug reserved ditolak");
  await deletePage(draft.id);
  await db.delete(page).where(eq(page.id, draft.id));

  const def = await getNotifPrefs(member.id);
  assert(
    def.comments && def.replies && def.follows && def.newContent,
    "notif prefs default semua true",
  );
  await saveNotifPrefs(member.id, {
    comments: false,
    replies: true,
    follows: true,
    newContent: false,
  });
  assert(!(await isNotifAllowed(member.id, "COMMENT")), "comments off -> COMMENT diblok");
  assert(await isNotifAllowed(member.id, "FOLLOW"), "follows on -> FOLLOW diizinkan");
  assert(await isNotifAllowed(member.id, "APPROVED"), "tipe non-preferensi selalu diizinkan");
  await saveNotifPrefs(member.id, {
    comments: true,
    replies: true,
    follows: true,
    newContent: true,
  });

  const prod = await saveProduct(
    { id: admin.id, role: "admin" },
    {
      title: "Cek R3 Produk",
      description: "desc",
      body: doc,
      kind: "SOURCE_CODE",
      status: "PUBLISHED",
      price: 0,
      stock: null,
      thumbnail: null,
      gallery: ["/uploads/a.webp", "/uploads/b.webp"],
      tags: ["nextjs", "drizzle"],
      version: "1.2.0",
      license: "MIT",
      demoUrl: "https://demo.example.com",
      repoUrl: "https://github.com/x/y",
      categoryId: null,
      postId: null,
    },
  );
  assert("id" in prod, "saveProduct dgn metadata baru");
  const pubProd = await getPublicProductBySlug("cek-r3-produk");
  assert(pubProd, "produk publik by slug");
  assert(pubProd!.gallery.length === 2, "gallery tersimpan");
  assert(pubProd!.tags.includes("nextjs"), "tags tersimpan");
  assert(pubProd!.version === "1.2.0", "version tersimpan");
  assert(pubProd!.license === "MIT", "license tersimpan");
  assert(pubProd!.demoUrl?.includes("demo"), "demoUrl tersimpan");
  assert(
    pubProd!.body && (pubProd!.body as { type?: string }).type === "doc",
    "body doc tersimpan",
  );
  await deleteProduct({ id: admin.id, role: "admin" }, prod.id);

  console.log("check-round3: SEMUA ASSERT LOLOS ✔");
  process.exit(0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
