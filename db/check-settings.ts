import assert from "node:assert";
import { eq } from "drizzle-orm";
import { db } from "../lib/db";
import { savePost } from "../lib/posts";
import {
  DEFAULT_SETTINGS,
  getSettings,
  KEEP_SENTINEL,
  maskSecrets,
  saveSettings,
} from "../lib/settings";
import { createOrder } from "../lib/store";
import { post, product, user } from "./schema";

const BASE = "http://localhost:3000";

async function signUp(password: string): Promise<number> {
  const r = await fetch(`${BASE}/api/auth/sign-up/email`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Origin: BASE },
    body: JSON.stringify({
      email: `cek-settings-${Date.now()}@example.com`,
      password,
      name: "Cek Settings",
      username: `cekset${Date.now()}`,
    }),
  });
  return r.status;
}

async function signIn(email: string, password: string): Promise<number> {
  const r = await fetch(`${BASE}/api/auth/sign-in/email`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Origin: BASE },
    body: JSON.stringify({ email, password }),
  });
  return r.status;
}

async function main() {
  const admin = (await db.query.user.findFirst({
    where: eq(user.username, "ardean"),
  }))!;
  const member = (await db.query.user.findFirst({
    where: eq(user.username, "sintadev"),
  }))!;
  assert(admin && member, "seed user ada");

  const s = await getSettings();
  assert(s.system.appName.length > 0, "settings termuat dgn default");

  const bad = await saveSettings({ system: { maxUploadMb: 0 } });
  assert("error" in bad, "nilai invalid ditolak validasi ArkType");

  const badColor = await saveSettings({
    appearance: { primaryColor: "biru" },
  });
  assert("error" in badColor, "primaryColor non-hex ditolak");

  await saveSettings({ system: { requireReview: false } });
  const direct = await savePost(
    { id: member.id, role: "member" },
    {
      meta: { type: "POST", categoryId: null, thumbnail: null, title: "CEK Set Publish" },
      body: { type: "doc", content: [] },
      publish: true,
    },
  );
  assert("id" in direct, "member simpan saat requireReview=false");
  const row1 = await db.query.post.findFirst({ where: eq(post.id, direct.id) });
  assert(row1?.status === "PUBLISHED", "requireReview=false -> member terbit LANGSUNG");

  await saveSettings({ system: { requireReview: true } });
  const reviewed = await savePost(
    { id: member.id, role: "member" },
    {
      meta: { type: "POST", categoryId: null, thumbnail: null, title: "CEK Set Review" },
      body: { type: "doc", content: [] },
      publish: true,
    },
  );
  assert("id" in reviewed, "member simpan saat requireReview=true");
  const row2 = await db.query.post.findFirst({
    where: eq(post.id, reviewed.id),
  });
  assert(row2?.status === "REVIEW", "requireReview=true -> member masuk REVIEW");

  await saveSettings({ system: { allowRegistration: false } });
  assert((await signUp("passwordvalid123")) === 403, "allowRegistration=false -> sign-up 403");
  await saveSettings({
    system: { allowRegistration: true },
    security: { minPasswordLength: 12 },
  });
  assert((await signUp("pendek123")) === 400, "minPasswordLength=12 -> password pendek 400");

  await saveSettings({
    integrations: {
      midtrans: { enabled: false },
      bankTransfer: { enabled: false },
    },
  });
  const prod = await db.query.product.findFirst({
    where: eq(product.slug, "starter-kit-next-drizzle"),
  });
  assert(prod, "produk seed ada");
  const ord = await createOrder(
    { id: member.id, name: member.name, email: member.email },
    prod!.id,
  );
  assert(
    "error" in ord && ord.error.includes("dinonaktifkan"),
    "semua pembayaran off -> order ditolak",
  );

  const secretSaved = await saveSettings({
    integrations: { deepl: { enabled: true, apiKey: "rahasia-deepl-123" } },
  });
  assert("ok" in secretSaved, "secret tersimpan");
  const masked = maskSecrets(secretSaved.settings);
  assert(
    masked.integrations.deepl.apiKey === KEEP_SENTINEL,
    "maskSecrets menyembunyikan apiKey terisi",
  );
  assert(masked.integrations.brevo.apiKey === "", "maskSecrets biarkan secret kosong tetap kosong");
  const kept = await saveSettings({
    integrations: { deepl: { enabled: false, apiKey: KEEP_SENTINEL } },
  });
  assert(
    "ok" in kept && kept.settings.integrations.deepl.apiKey === "rahasia-deepl-123",
    "KEEP_SENTINEL mempertahankan secret lama",
  );

  await saveSettings({ security: { maxLoginAttempts: 3, lockoutMinutes: 1 } });
  const lockEmail = `lock-${Date.now()}@example.com`;
  for (let i = 0; i < 3; i++) {
    const st = await signIn(lockEmail, "salah-terus-123");
    assert(st === 401 || st === 400, `percobaan ${i + 1} gagal wajar`);
  }
  assert(
    (await signIn(lockEmail, "salah-terus-123")) === 429,
    "maxLoginAttempts terlampaui -> 429 lockout",
  );

  const restored = await saveSettings(DEFAULT_SETTINGS);
  assert("ok" in restored, "settings dikembalikan ke default");

  await db.delete(post).where(eq(post.id, direct.id));
  await db.delete(post).where(eq(post.id, reviewed.id));

  console.log("check-settings: SEMUA ASSERT LOLOS ✔");
  process.exit(0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
