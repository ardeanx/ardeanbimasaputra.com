import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { and, eq, inArray } from "drizzle-orm";
import ProductCard from "@/components/cards/ProductCard";
import { KIND_LABEL_KEYS } from "@/components/cards/productKinds";
import RenderDoc from "@/components/content/RenderDoc";
import JsonLd from "@/components/seo/JsonLd";
import { DownloadIcon } from "@/components/shell/icons";
import BuyButton from "@/components/store/BuyButton";
import ProductGallery from "@/components/store/ProductGallery";
import { entitlement } from "@/db/schema";
import { prepareDoc } from "@/lib/content";
import { db } from "@/lib/db";
import { fmtBytes } from "@/lib/format";
import { getFmt } from "@/lib/format-server";
import { getT } from "@/lib/i18n";
import { breadcrumbList, product as productLd } from "@/lib/jsonld";
import { getMidtransConfig } from "@/lib/midtrans";
import { getPublicProductBySlug, listPublishedProducts } from "@/lib/products";
import { canDownload } from "@/lib/resources";
import { baseUrl } from "@/lib/seo";
import { getSession } from "@/lib/session";
import { getSettings } from "@/lib/settings";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const t = await getT();
  const p = await getPublicProductBySlug(slug);
  if (!p) return { title: t("meta.notFound") };
  const description = p.description?.slice(0, 160) || t("store.productBy", { name: p.owner.name });
  const url = `/store/${p.slug}`;
  const ogImage = p.gallery?.[0] ?? p.thumbnail;
  return {
    title: p.title,
    description,
    alternates: { canonical: url },
    openGraph: {
      title: p.title,
      description,
      url,
      images: ogImage ? [{ url: ogImage }] : undefined,
    },
    twitter: {
      card: "summary_large_image",
      title: p.title,
      description,
      images: ogImage ? [ogImage] : undefined,
    },
  };
}

export default async function ProductDetail({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const t = await getT();
  const fmt = await getFmt();
  const p = await getPublicProductBySlug(slug);
  if (!p) notFound();

  const session = await getSession();
  const settings = await getSettings();
  const midtransCfg = await getMidtransConfig();
  const viewerId = session?.user.id ?? null;
  const viewerRole = (session?.user as { role?: string | null } | undefined)?.role ?? null;

  const related = (await listPublishedProducts()).filter((x) => x.id !== p.id).slice(0, 3);

  let owned = new Set<string>();
  if (viewerId) {
    const rows = await db
      .select({ productId: entitlement.productId })
      .from(entitlement)
      .where(
        and(
          eq(entitlement.userId, viewerId),
          inArray(entitlement.productId, [p.id, ...related.map((r) => r.id)]),
        ),
      );
    owned = new Set(rows.map((r) => r.productId));
  }

  const entitled = await canDownload(viewerId ? { id: viewerId, role: viewerRole } : null, {
    post: null,
    product: {
      id: p.id,
      ownerId: p.ownerId,
      price: p.price,
      status: p.status,
    },
  });

  const doc = p.body ? await prepareDoc(p.body) : null;
  const galleryImages = Array.from(
    new Set([p.thumbnail, ...(p.gallery ?? [])].filter((s): s is string => Boolean(s))),
  );

  const isOwned = owned.has(p.id);
  const isFree = p.price === 0;
  const kindLabel = t(KIND_LABEL_KEYS[p.kind] ?? "") || p.kind;
  const hasStock = p.stock !== null;
  const inStock = (p.stock ?? 0) > 0;

  const specs: { label: string; value: string }[] = [
    { label: t("store.specType"), value: kindLabel },
    ...(p.category ? [{ label: t("store.specCategory"), value: p.category.name }] : []),
    ...(p.version ? [{ label: t("store.version"), value: `v${p.version}` }] : []),
    ...(p.license ? [{ label: t("store.specLicense"), value: p.license }] : []),
    ...(hasStock
      ? [
          {
            label: t("store.specStock"),
            value: inStock ? String(p.stock) : t("store.outOfStock"),
          },
        ]
      : []),
  ];
  const attrs = (p.attributes ?? []).filter((a) => a.label || a.value);
  const variants = (p.variants ?? []).filter((v) => v.name && v.options.length > 0);

  const buyCta = isOwned ? (
    <span className="inline-flex h-9 shrink-0 items-center rounded-full bg-green-500/15 px-4 text-sm font-semibold text-green-600 dark:text-green-400">
      {t("store.owned")}
    </span>
  ) : isFree ? (
    <span className="inline-flex h-9 shrink-0 items-center rounded-full bg-yt-chip px-4 text-sm font-semibold">
      {t("store.free")}
    </span>
  ) : (
    <BuyButton
      productId={p.id}
      price={p.price}
      viewerId={viewerId}
      clientKey={midtransCfg.clientKey}
      production={midtransCfg.production}
      midtransEnabled={settings.integrations.midtrans.enabled}
      bankEnabled={settings.integrations.bankTransfer.enabled}
    />
  );

  const base = baseUrl();
  const breadcrumb = breadcrumbList([
    { name: t("nav.home"), url: base },
    { name: t("nav.store"), url: `${base}/store` },
    { name: kindLabel, url: `${base}/store/${p.slug}` },
  ]);

  return (
    <div className="mx-auto max-w-6xl px-4 pb-40 pt-6 sm:px-6 lg:pb-16">
      <JsonLd data={productLd(p, base, "IDR")} />
      <JsonLd data={breadcrumb} />
      <nav className="mb-4 text-sm text-yt-text2">
        <Link href="/store" className="hover:text-yt-text">
          {t("nav.store")}
        </Link>
        <span className="mx-1.5">/</span>
        <span className="text-yt-text">{kindLabel}</span>
      </nav>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_22rem] lg:gap-8 lg:[grid-template-areas:'gallery_side''main_side'] [grid-template-areas:'gallery''side''main']">
        <div className="min-w-0 [grid-area:gallery]">
          {galleryImages.length > 1 ? (
            <ProductGallery images={galleryImages} kind={p.kind} title={p.title} />
          ) : (
            <div className="relative aspect-video overflow-hidden rounded-2xl border border-yt-outline bg-yt-hover">
              {p.thumbnail && (
                <Image
                  src={p.thumbnail}
                  alt={p.title}
                  fill
                  priority
                  sizes="(max-width: 1024px) 100vw, 720px"
                  className="object-cover"
                />
              )}
              <span className="absolute left-3 top-3 rounded bg-black/80 px-2 py-1 text-xs font-medium text-white">
                {kindLabel}
              </span>
            </div>
          )}
        </div>

        <aside className="space-y-6 [grid-area:side] lg:sticky lg:top-6 lg:self-start">
          <div className="rounded-2xl border border-yt-outline bg-yt-raised p-5">
            <span className="inline-flex items-center rounded-full bg-yt-chip px-3 py-1 text-xs font-medium text-yt-text2">
              {kindLabel}
            </span>

            <h1 className="mt-3 text-2xl font-bold leading-tight lg:text-3xl">{p.title}</h1>

            <Link href={`/@${p.owner.username}`} className="mt-3 flex items-center gap-2.5">
              <img
                src={p.owner.image ?? ""}
                alt=""
                className="h-9 w-9 rounded-full bg-yt-hover object-cover"
              />
              <span className="min-w-0">
                <span className="block text-xs text-yt-text2">{t("store.soldBy")}</span>
                <span className="block truncate text-sm font-medium hover:underline">
                  {p.owner.name}
                </span>
              </span>
            </Link>

            <div className="mt-4 border-t border-yt-outline pt-4">
              <div className="text-3xl font-bold tracking-tight">
                {isFree ? t("store.free") : fmt.price(p.price)}
              </div>
            </div>

            {p.description && (
              <p className="mt-3 line-clamp-3 text-sm leading-6 text-yt-text2">{p.description}</p>
            )}

            {(hasStock || p.version || p.license || (p.tags && p.tags.length > 0)) && (
              <div className="mt-4 flex flex-wrap gap-2 text-xs">
                {hasStock && (
                  <span
                    className={`inline-flex items-center rounded-full px-2.5 py-1 font-medium ${
                      inStock
                        ? "bg-green-500/15 text-green-600 dark:text-green-400"
                        : "bg-yt-chip text-yt-text2"
                    }`}
                  >
                    {inStock ? t("store.inStock") : t("store.outOfStock")}
                  </span>
                )}
                {p.version && (
                  <span className="rounded-full bg-yt-chip px-2.5 py-1 text-yt-text2">
                    v{p.version}
                  </span>
                )}
                {p.license && (
                  <span className="rounded-full bg-yt-chip px-2.5 py-1 text-yt-text2">
                    {p.license}
                  </span>
                )}
              </div>
            )}

            {variants.length > 0 && (
              <div className="mt-4">
                <span className="mb-2 block text-xs font-semibold uppercase tracking-wide text-yt-text2">
                  {t("store.variants")}
                </span>
                <div className="space-y-3">
                  {variants.map((v) => (
                    <div key={v.name}>
                      <span className="mb-1.5 block text-xs font-medium text-yt-text2">
                        {v.name}
                      </span>
                      <div className="flex flex-wrap gap-2">
                        {v.options.map((o, i) => (
                          <span
                            key={o}
                            className={`rounded-full border px-3 py-1 text-sm ${
                              i === 0
                                ? "border-yt-cta bg-yt-cta/10 font-medium text-yt-text"
                                : "border-yt-outline text-yt-text2"
                            }`}
                          >
                            {o}
                          </span>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="mt-5 hidden lg:block">{buyCta}</div>

            {(p.demoUrl || p.repoUrl) && (
              <div className="mt-3 flex gap-2">
                {p.demoUrl && (
                  <a
                    href={p.demoUrl}
                    target="_blank"
                    rel="noopener noreferrer nofollow"
                    className="flex h-10 flex-1 items-center justify-center rounded-full border border-yt-outline text-sm font-medium hover:bg-yt-hover"
                  >
                    {t("store.demo")}
                  </a>
                )}
                {p.repoUrl && (
                  <a
                    href={p.repoUrl}
                    target="_blank"
                    rel="noopener noreferrer nofollow"
                    className="flex h-10 flex-1 items-center justify-center rounded-full border border-yt-outline text-sm font-medium hover:bg-yt-hover"
                  >
                    {t("store.repository")}
                  </a>
                )}
              </div>
            )}
          </div>

          <section className="rounded-2xl border border-yt-outline bg-yt-raised p-5">
            <h2 className="mb-4 text-base font-semibold">{t("store.specifications")}</h2>
            <dl className="divide-y divide-yt-outline text-sm">
              {specs.map((s) => (
                <div key={s.label} className="flex items-start justify-between gap-4 py-2.5">
                  <dt className="text-yt-text2">{s.label}</dt>
                  <dd className="text-right font-medium">{s.value}</dd>
                </div>
              ))}
            </dl>
            {attrs.length > 0 && (
              <>
                <h3 className="mb-1 mt-4 text-xs font-semibold uppercase tracking-wide text-yt-text2">
                  {t("store.attributes")}
                </h3>
                <dl className="divide-y divide-yt-outline text-sm">
                  {attrs.map((a, i) => (
                    <div
                      key={`${a.label}-${i}`}
                      className="flex items-start justify-between gap-4 py-2.5"
                    >
                      <dt className="text-yt-text2">{a.label}</dt>
                      <dd className="text-right font-medium">{a.value}</dd>
                    </div>
                  ))}
                </dl>
              </>
            )}
          </section>
        </aside>

        <div className="min-w-0 space-y-8 [grid-area:main]">
          {(doc != null || p.description) && (
            <section>
              <h2 className="mb-4 text-lg font-semibold">{t("store.tabDescription")}</h2>
              {doc != null ? (
                <RenderDoc doc={doc} />
              ) : (
                <p className="whitespace-pre-line text-[15px] leading-7 text-yt-text">
                  {p.description}
                </p>
              )}
            </section>
          )}

          {p.tags && p.tags.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {p.tags.map((tag) => (
                <span
                  key={tag}
                  className="rounded-full border border-yt-outline px-2.5 py-0.5 text-xs text-yt-text2"
                >
                  #{tag}
                </span>
              ))}
            </div>
          )}

          {p.files.length > 0 && (
            <section className="rounded-2xl border border-yt-outline p-4">
              <h2 className="mb-3 text-base font-semibold">
                {t("resource.filesHeading", { n: p.files.length })}
              </h2>
              <ul className="space-y-2">
                {p.files.map((f) => (
                  <li key={f.id} className="flex items-center gap-3 text-sm">
                    <span className="min-w-0 flex-1">
                      <span className="line-clamp-1 font-medium">{f.filename}</span>
                      <span className="block text-xs text-yt-text2">
                        v{f.version} · {fmtBytes(f.size)}
                      </span>
                    </span>
                    {entitled && (
                      <a
                        href={`/api/download/${f.id}`}
                        className="flex h-9 shrink-0 items-center gap-1.5 rounded-full bg-yt-cta px-3.5 text-sm font-medium text-yt-cta-text"
                      >
                        <DownloadIcon width={18} height={18} /> {t("resource.download")}
                      </a>
                    )}
                  </li>
                ))}
              </ul>
              {!entitled && (
                <p className="mt-3 text-xs text-yt-text2">{t("store.buyToDownload")}</p>
              )}
            </section>
          )}

          {p.post && p.post.status === "PUBLISHED" && (
            <p className="text-sm">
              <Link href={`/${p.post.slug}`} className="text-yt-cta hover:underline">
                {t("store.relatedContent", { title: p.post.title })}
              </Link>
            </p>
          )}
        </div>
      </div>

      {related.length > 0 && (
        <section className="mt-12">
          <h2 className="mb-4 text-lg font-semibold">{t("store.moreProducts")}</h2>
          <div className="card-grid">
            {related.map((r) => (
              <ProductCard key={r.id} product={r} owned={owned.has(r.id)} />
            ))}
          </div>
        </section>
      )}

      <div className="fixed inset-x-0 bottom-14 z-40 border-t border-yt-outline bg-yt-base/95 px-4 py-3 backdrop-blur lg:hidden">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3">
          <div className="min-w-0">
            <div className="truncate text-lg font-bold tracking-tight">
              {isFree ? t("store.free") : fmt.price(p.price)}
            </div>
          </div>
          {buyCta}
        </div>
      </div>
    </div>
  );
}
