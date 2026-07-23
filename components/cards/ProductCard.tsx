import Image from "next/image";
import Link from "next/link";
import { fmtPrice } from "@/lib/format";
import { getT } from "@/lib/i18n";
import { KIND_LABEL_KEYS } from "./productKinds";

export type ProductCardData = {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  kind: string;
  price: number;
  thumbnail: string | null;
  owner: { name: string };
};

export default async function ProductCard({
  product,
  owned = false,
}: {
  product: ProductCardData;
  owned?: boolean;
}) {
  const t = await getT();
  return (
    <Link
      href={`/store/${product.slug}`}
      aria-label={product.title}
      className="group relative isolate flex flex-col gap-3"
    >
      <span
        aria-hidden
        className="absolute -inset-2 -z-10 rounded-2xl bg-yt-hover opacity-0 transition-opacity duration-300 group-hover:opacity-100 group-hover:delay-100"
      />
      <div className="relative aspect-video overflow-hidden rounded-xl bg-yt-hover">
        {product.thumbnail && (
          <Image
            src={product.thumbnail}
            alt=""
            fill
            sizes="(max-width: 792px) 100vw, 360px"
            className="object-cover"
          />
        )}
        <span className="absolute left-2 top-2 rounded bg-black/80 px-1.5 py-0.5 text-xs font-medium text-white">
          {t(KIND_LABEL_KEYS[product.kind] ?? "") || product.kind}
        </span>
      </div>
      <div className="min-w-0">
        <h3 className="line-clamp-2 text-base font-medium leading-[22px]">{product.title}</h3>
        <p className="mt-1 text-sm text-yt-text2">{product.owner.name}</p>
        <div className="mt-1 flex items-center gap-2">
          <span className="text-sm font-semibold">
            {product.price === 0 ? t("store.free") : fmtPrice(product.price)}
          </span>
          {owned && (
            <span className="rounded-full bg-yt-chip px-2 py-0.5 text-xs font-medium text-green-600 dark:text-green-400">
              {t("store.owned")}
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}
