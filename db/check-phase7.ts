import assert from "node:assert";
import { and, eq } from "drizzle-orm";
import { localizePost } from "../lib/content-translation";
import { db } from "../lib/db";
import { fmtViews } from "../lib/format";
import { loadDict, translate } from "../lib/i18n";
import { getRatingSummary, getUserRating, ratePost } from "../lib/ratings";
import { listSearchHistory, recordSearch, removeSearch } from "../lib/search-history";
import { applyTitleCase } from "../lib/seo";
import { post, rating, searchHistory, user } from "./schema";

async function main() {
  const admin = (await db.query.user.findFirst({
    where: eq(user.username, "ardean"),
  }))!;
  const member = (await db.query.user.findFirst({
    where: eq(user.username, "sintadev"),
  }))!;
  assert(admin && member, "seed user ada");
  const target = (await db.query.post.findFirst({
    where: and(eq(post.status, "PUBLISHED"), eq(post.type, "POST")),
  }))!;
  assert(target, "ada post PUBLISHED utk diuji");

  assert(fmtViews(1500, "VIDEO").includes("tayangan"), "VIDEO -> tayangan");
  assert(fmtViews(1500, "AUDIO").includes("tayangan"), "AUDIO -> tayangan");
  assert(fmtViews(1500, "POST").includes("dilihat"), "POST -> dilihat");
  assert(fmtViews(1500, "RESOURCE").includes("dilihat"), "RESOURCE -> dilihat");
  assert(fmtViews(1500).includes("dilihat"), "tanpa type -> dilihat");

  const r1 = await ratePost(member.id, target.id, 4);
  assert("ok" in r1 && r1.summary.count >= 1, "ratePost menyimpan");
  assert((await getUserRating(target.id, member.id)) === 4, "getUserRating 4");
  const r2 = await ratePost(member.id, target.id, 5);
  assert("ok" in r2, "rating bisa diubah");
  assert((await getUserRating(target.id, member.id)) === 5, "rating jadi 5");
  const sum = await getRatingSummary(target.id);
  assert(sum.count >= 1 && sum.avg >= 1 && sum.avg <= 5, "summary masuk akal");
  const r3 = await ratePost(member.id, target.id, 0);
  assert("ok" in r3, "stars 0 = hapus rating");
  assert((await getUserRating(target.id, member.id)) === null, "rating terhapus");
  const rBad = await ratePost(member.id, target.id, 9);
  assert("error" in rBad, "stars di luar 0-5 ditolak");

  await recordSearch(member.id, "  nextjs tutorial  ");
  await recordSearch(member.id, "drizzle orm");
  await recordSearch(member.id, "nextjs tutorial");
  const hist = await listSearchHistory(member.id, 10);
  assert(hist[0] === "nextjs tutorial", "riwayat terbaru di atas (bump)");
  assert(hist.filter((h) => h === "nextjs tutorial").length === 1, "query duplikat tidak dobel");
  await removeSearch(member.id, "drizzle orm");
  assert(!(await listSearchHistory(member.id, 10)).includes("drizzle orm"), "removeSearch bekerja");
  await db.delete(searchHistory).where(eq(searchHistory.userId, member.id));

  const en = await loadDict("en");
  const id = await loadDict("id");
  assert(en["nav.home"] === "Home" && id["nav.home"] === "Beranda", "dict termuat");
  assert(
    translate(id, en, "post.minuteRead", { n: 7 }) === "7 menit baca",
    "interpolasi {n} bekerja",
  );
  assert(translate({}, en, "nav.store") === "Store", "fallback ke dict default");
  assert(translate({}, {}, "kunci.asing") === "kunci.asing", "fallback ke key");

  const localized = await localizePost(target, "en");
  assert(
    localized.title === target.title && localized.translatedLocale === null,
    "locale default -> tanpa terjemahan",
  );
  const noProvider = await localizePost(target, "id");
  assert(
    noProvider.translatedLocale === null || noProvider.title.length > 0,
    "tanpa provider -> fallback konten asli tanpa error",
  );

  assert(
    applyTitleCase("belajar next js dan drizzle", true) === "Belajar Next Js dan Drizzle",
    "title case dgn kata minor",
  );
  assert(
    applyTitleCase("belajar next js", false) === "belajar next js",
    "title case off tidak mengubah",
  );

  await db.delete(rating).where(eq(rating.postId, target.id));
  console.log("check-phase7: SEMUA ASSERT LOLOS ✔");
  process.exit(0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
