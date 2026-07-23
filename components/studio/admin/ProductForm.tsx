"use client";

import { ArrowLeft, ArrowRight, Plus, Trash2, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import { deleteProductAction, saveProductAction } from "@/app/(studio)/studio/produk/actions";
import { useT } from "@/components/i18n/I18nProvider";
import ProductBodyEditor from "@/components/store/ProductBodyEditor";
import MediaPicker from "@/components/studio/MediaPicker";
import ProductFiles from "@/components/studio/admin/ProductFiles";
import Select from "@/components/ui/Select";
import { askConfirm } from "@/components/ui/dialog";
import type { ProductInput, ProductKind, ProductStatus } from "@/lib/products";

const MAX_GALLERY = 12;

function slugifyClient(s: string): string {
  return s
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 80);
}

const inputCls =
  "h-10 w-full rounded-lg border border-yt-outline bg-transparent px-3 text-sm outline-none focus:border-yt-cta";

export default function ProductForm({
  posts,
  categories,
  defaults,
}: {
  posts: { id: string; title: string }[];
  categories: { id: number; name: string }[];
  defaults?: ProductInput & { id: string };
}) {
  const t = useT();
  const router = useRouter();

  const KIND_OPTIONS = [
    { value: "DIGITAL", label: t("studio.produk.kindDigital") },
    { value: "SOURCE_CODE", label: t("studio.produk.kindSourceCode") },
    { value: "PHYSICAL", label: t("studio.produk.kindPhysical") },
    { value: "SERVICE", label: t("studio.produk.kindService") },
  ];
  const STATUS_OPTIONS = [
    { value: "DRAFT", label: t("studio.produk.statusDraft") },
    { value: "PUBLISHED", label: t("studio.produk.statusPublished") },
    { value: "ARCHIVED", label: t("studio.produk.statusArchived") },
  ];
  const LICENSE_OPTIONS = [
    { value: "", label: t("studio.produk.noLicense") },
    { value: "MIT", label: "MIT" },
    { value: "Apache-2.0", label: "Apache-2.0" },
    { value: "GPL", label: "GPL" },
    { value: "Proprietary", label: "Proprietary" },
    { value: "Custom", label: "Custom" },
  ];

  const [pending, startTransition] = useTransition();
  const [title, setTitle] = useState(defaults?.title ?? "");
  const [slug, setSlug] = useState(defaults?.slug ?? "");
  const [slugTouched, setSlugTouched] = useState(!!defaults);
  const [description, setDescription] = useState(defaults?.description ?? "");
  const [body, setBody] = useState<unknown>(defaults?.body ?? null);
  const [kind, setKind] = useState<ProductKind>(defaults?.kind ?? "DIGITAL");
  const [status, setStatus] = useState<ProductStatus>(defaults?.status ?? "DRAFT");
  const [price, setPrice] = useState(String(defaults?.price ?? 0));
  const [stock, setStock] = useState(String(defaults?.stock ?? 0));
  const [thumbnail, setThumbnail] = useState<string | null>(defaults?.thumbnail ?? null);
  const [gallery, setGallery] = useState<string[]>(defaults?.gallery ?? []);
  const [tags, setTags] = useState<string[]>(defaults?.tags ?? []);
  const [tagInput, setTagInput] = useState("");
  const [attributes, setAttributes] = useState<{ label: string; value: string }[]>(
    defaults?.attributes ?? [],
  );
  const [variants, setVariants] = useState<{ name: string; optionsText: string }[]>(
    (defaults?.variants ?? []).map((v) => ({
      name: v.name,
      optionsText: v.options.join(", "),
    })),
  );
  const [version, setVersion] = useState(defaults?.version ?? "");
  const [license, setLicense] = useState(defaults?.license ?? "");
  const [demoUrl, setDemoUrl] = useState(defaults?.demoUrl ?? "");
  const [repoUrl, setRepoUrl] = useState(defaults?.repoUrl ?? "");
  const [categoryId, setCategoryId] = useState(
    defaults?.categoryId != null ? String(defaults.categoryId) : "",
  );
  const [postId, setPostId] = useState(defaults?.postId ?? "");

  const postOptions = [
    { value: "", label: t("studio.produk.noContentLink") },
    ...posts.map((p) => ({ value: p.id, label: p.title })),
  ];
  const categoryOptions = [
    { value: "", label: t("studio.produk.noCategory") },
    ...categories.map((c) => ({ value: String(c.id), label: c.name })),
  ];

  function addTag() {
    const t = tagInput.trim().replace(/,$/, "").trim();
    if (t && !tags.includes(t) && tags.length < 20) setTags([...tags, t]);
    setTagInput("");
  }

  function moveImage(from: number, to: number) {
    if (to < 0 || to >= gallery.length) return;
    const next = [...gallery];
    const [item] = next.splice(from, 1);
    next.splice(to, 0, item);
    setGallery(next);
  }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) {
      toast.error(t("studio.produk.titleRequired"));
      return;
    }
    startTransition(async () => {
      const res = await saveProductAction({
        id: defaults?.id,
        title,
        slug: slug || undefined,
        description,
        body,
        kind,
        status,
        price: Number(price) || 0,
        stock: kind === "PHYSICAL" ? Number(stock) || 0 : null,
        thumbnail,
        gallery,
        tags,
        attributes: attributes
          .map((a) => ({ label: a.label.trim(), value: a.value.trim() }))
          .filter((a) => a.label || a.value),
        variants: variants
          .map((v) => ({
            name: v.name.trim(),
            options: v.optionsText
              .split(",")
              .map((o) => o.trim())
              .filter(Boolean),
          }))
          .filter((v) => v.name && v.options.length > 0),
        version: version.trim() || null,
        license: license.trim() || null,
        demoUrl: demoUrl.trim() || null,
        repoUrl: repoUrl.trim() || null,
        categoryId: categoryId ? Number(categoryId) : null,
        postId: postId || null,
      });
      if ("error" in res) {
        toast.error(res.error);
        return;
      }
      toast.success(t("studio.produk.saved"));
      router.push("/studio/produk");
    });
  }

  async function remove() {
    if (!defaults?.id) return;
    const ok = await askConfirm({
      title: t("studio.produk.deleteTitle"),
      body: t("studio.produk.deleteBody"),
      confirmLabel: t("common.delete"),
      danger: true,
    });
    if (!ok) return;
    startTransition(async () => {
      const res = await deleteProductAction(defaults.id);
      if ("error" in res) {
        toast.error(res.error);
        return;
      }
      toast.success(t("studio.produk.deleted"));
      router.push("/studio/produk");
    });
  }

  return (
    <form onSubmit={submit} className="space-y-6">
      <div className="grid gap-6 lg:grid-cols-2 lg:items-start">
        <div className="space-y-5">
          <div>
            <label htmlFor="produk-judul" className="mb-1.5 block text-sm font-medium">
              {t("studio.produk.labelTitle")}
            </label>
            <input
              id="produk-judul"
              value={title}
              onChange={(e) => {
                setTitle(e.target.value);
                if (!slugTouched) setSlug(slugifyClient(e.target.value));
              }}
              placeholder={t("studio.produk.placeholderTitle")}
              className={inputCls}
            />
          </div>

          <div>
            <label htmlFor="produk-slug" className="mb-1.5 block text-sm font-medium">
              {t("studio.produk.labelSlug")}
            </label>
            <input
              id="produk-slug"
              value={slug}
              onChange={(e) => {
                setSlugTouched(true);
                setSlug(slugifyClient(e.target.value));
              }}
              placeholder="slug-produk"
              className={inputCls}
            />
          </div>

          <div>
            <label htmlFor="produk-deskripsi" className="mb-1.5 block text-sm font-medium">
              {t("studio.produk.labelDescription")}
            </label>
            <textarea
              id="produk-deskripsi"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={4}
              placeholder={t("studio.produk.placeholderDescription")}
              className="w-full rounded-lg border border-yt-outline bg-transparent px-3 py-2 text-sm outline-none focus:border-yt-cta"
            />
          </div>

          <div>
            <span className="mb-1.5 block text-sm font-medium">{t("studio.produk.labelBody")}</span>
            <ProductBodyEditor value={body} onChange={setBody} />
          </div>

          <div>
            <span className="mb-1.5 block text-sm font-medium">
              {t("studio.produk.labelThumbnail")}
            </span>
            <MediaPicker value={thumbnail} onChange={setThumbnail} />
          </div>

          <div>
            <span className="mb-1.5 block text-sm font-medium">
              {t("studio.produk.labelGallery", { count: gallery.length, max: MAX_GALLERY })}
            </span>
            {gallery.length > 0 && (
              <div className="mb-3 grid grid-cols-2 gap-3 sm:grid-cols-3">
                {gallery.map((src, i) => (
                  <div
                    key={src}
                    className="relative aspect-video overflow-hidden rounded-lg border border-yt-outline"
                  >
                    <img src={src} alt="" className="h-full w-full object-cover" />
                    <div className="absolute inset-x-0 bottom-0 flex justify-between bg-black/60 p-1">
                      <div className="flex gap-1">
                        <button
                          type="button"
                          aria-label={t("studio.produk.moveLeft")}
                          disabled={i === 0}
                          onClick={() => moveImage(i, i - 1)}
                          className="grid h-6 w-6 place-items-center rounded text-white disabled:opacity-30"
                        >
                          <ArrowLeft size={14} />
                        </button>
                        <button
                          type="button"
                          aria-label={t("studio.produk.moveRight")}
                          disabled={i === gallery.length - 1}
                          onClick={() => moveImage(i, i + 1)}
                          className="grid h-6 w-6 place-items-center rounded text-white disabled:opacity-30"
                        >
                          <ArrowRight size={14} />
                        </button>
                      </div>
                      <button
                        type="button"
                        aria-label={t("studio.produk.removeImage")}
                        onClick={() => setGallery(gallery.filter((_, j) => j !== i))}
                        className="grid h-6 w-6 place-items-center rounded text-white hover:text-red-400"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
            {gallery.length < MAX_GALLERY && (
              <MediaPicker
                value={null}
                onChange={(url) => setGallery((g) => (g.includes(url) ? g : [...g, url]))}
              />
            )}
          </div>
        </div>

        <div className="space-y-5">
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
            <div>
              <span className="mb-1.5 block text-sm font-medium">
                {t("studio.produk.labelKind")}
              </span>
              <Select
                value={kind}
                options={KIND_OPTIONS}
                onChange={(v) => setKind(v as ProductKind)}
                ariaLabel={t("studio.produk.labelKind")}
              />
            </div>
            <div>
              <span className="mb-1.5 block text-sm font-medium">
                {t("studio.produk.labelStatus")}
              </span>
              <Select
                value={status}
                options={STATUS_OPTIONS}
                onChange={(v) => setStatus(v as ProductStatus)}
                ariaLabel={t("studio.produk.labelStatus")}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
            <div>
              <label htmlFor="produk-harga" className="mb-1.5 block text-sm font-medium">
                {t("studio.produk.labelPrice")}
              </label>
              <input
                id="produk-harga"
                type="number"
                min={0}
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                className={inputCls}
              />
              <p className="mt-1 text-xs text-yt-text2">{t("studio.produk.priceHint")}</p>
            </div>
            {kind === "PHYSICAL" && (
              <div>
                <label htmlFor="produk-stok" className="mb-1.5 block text-sm font-medium">
                  {t("studio.produk.labelStock")}
                </label>
                <input
                  id="produk-stok"
                  type="number"
                  min={0}
                  value={stock}
                  onChange={(e) => setStock(e.target.value)}
                  className={inputCls}
                />
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
            <div>
              <span className="mb-1.5 block text-sm font-medium">
                {t("studio.produk.labelCategory")}
              </span>
              <Select
                value={categoryId}
                options={categoryOptions}
                onChange={setCategoryId}
                ariaLabel={t("studio.produk.labelCategory")}
              />
            </div>
            <div>
              <span className="mb-1.5 block text-sm font-medium">
                {t("studio.produk.labelLicense")}
              </span>
              <Select
                value={LICENSE_OPTIONS.some((o) => o.value === license) ? license : "Custom"}
                options={LICENSE_OPTIONS}
                onChange={(v) => setLicense(v === "Custom" ? license || "Custom" : v)}
                ariaLabel={t("studio.produk.labelLicense")}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
            <div>
              <label htmlFor="produk-versi" className="mb-1.5 block text-sm font-medium">
                {t("studio.produk.labelVersion")}
              </label>
              <input
                id="produk-versi"
                value={version}
                onChange={(e) => setVersion(e.target.value)}
                placeholder="1.0.0"
                className={inputCls}
              />
            </div>
            <div>
              <label htmlFor="produk-demo" className="mb-1.5 block text-sm font-medium">
                {t("studio.produk.labelDemoUrl")}
              </label>
              <input
                id="produk-demo"
                value={demoUrl}
                onChange={(e) => setDemoUrl(e.target.value)}
                placeholder="https://…"
                className={inputCls}
              />
            </div>
            <div>
              <label htmlFor="produk-repo" className="mb-1.5 block text-sm font-medium">
                {t("studio.produk.labelRepoUrl")}
              </label>
              <input
                id="produk-repo"
                value={repoUrl}
                onChange={(e) => setRepoUrl(e.target.value)}
                placeholder="https://github.com/…"
                className={inputCls}
              />
            </div>
          </div>

          <div>
            <span className="mb-1.5 block text-sm font-medium">{t("studio.produk.labelTags")}</span>
            <div className="flex flex-wrap gap-2">
              {tags.map((tag, i) => (
                <span
                  key={tag}
                  className="flex items-center gap-1 rounded-full bg-yt-chip px-3 py-1 text-sm"
                >
                  {tag}
                  <button
                    type="button"
                    aria-label={t("studio.produk.removeTag", { tag })}
                    onClick={() => setTags(tags.filter((_, j) => j !== i))}
                    className="text-yt-text2 hover:text-red-500"
                  >
                    <X size={14} />
                  </button>
                </span>
              ))}
            </div>
            <input
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === ",") {
                  e.preventDefault();
                  addTag();
                } else if (e.key === "Backspace" && !tagInput && tags.length) {
                  setTags(tags.slice(0, -1));
                }
              }}
              onBlur={addTag}
              placeholder={t("studio.produk.tagPlaceholder")}
              className={`mt-2 ${inputCls}`}
            />
          </div>

          <div>
            <span className="mb-1.5 block text-sm font-medium">
              {t("studio.produk.labelAttributes")}
            </span>
            <p className="mb-2 text-xs text-yt-text2">{t("studio.produk.attributesHint")}</p>
            <div className="space-y-2">
              {attributes.map((a, i) => (
                <div key={i} className="flex gap-2">
                  <input
                    value={a.label}
                    onChange={(e) =>
                      setAttributes(
                        attributes.map((x, j) => (j === i ? { ...x, label: e.target.value } : x)),
                      )
                    }
                    placeholder={t("studio.produk.attrLabelPlaceholder")}
                    className={inputCls}
                  />
                  <input
                    value={a.value}
                    onChange={(e) =>
                      setAttributes(
                        attributes.map((x, j) => (j === i ? { ...x, value: e.target.value } : x)),
                      )
                    }
                    placeholder={t("studio.produk.attrValuePlaceholder")}
                    className={inputCls}
                  />
                  <button
                    type="button"
                    aria-label={t("studio.produk.removeAttribute")}
                    onClick={() => setAttributes(attributes.filter((_, j) => j !== i))}
                    className="grid h-10 w-10 shrink-0 place-items-center rounded-lg border border-yt-outline text-yt-text2 hover:text-red-500"
                  >
                    <X size={16} />
                  </button>
                </div>
              ))}
            </div>
            <button
              type="button"
              onClick={() => setAttributes([...attributes, { label: "", value: "" }])}
              className="mt-2 flex h-9 items-center gap-1.5 rounded-full border border-yt-outline px-3 text-sm font-medium hover:bg-yt-hover"
            >
              <Plus size={16} /> {t("studio.produk.addAttribute")}
            </button>
          </div>

          <div>
            <span className="mb-1.5 block text-sm font-medium">
              {t("studio.produk.labelVariants")}
            </span>
            <p className="mb-2 text-xs text-yt-text2">{t("studio.produk.variantsHint")}</p>
            <div className="space-y-2">
              {variants.map((v, i) => (
                <div key={i} className="flex gap-2">
                  <input
                    value={v.name}
                    onChange={(e) =>
                      setVariants(
                        variants.map((x, j) => (j === i ? { ...x, name: e.target.value } : x)),
                      )
                    }
                    placeholder={t("studio.produk.variantNamePlaceholder")}
                    className={inputCls}
                  />
                  <input
                    value={v.optionsText}
                    onChange={(e) =>
                      setVariants(
                        variants.map((x, j) =>
                          j === i ? { ...x, optionsText: e.target.value } : x,
                        ),
                      )
                    }
                    placeholder={t("studio.produk.variantOptionsPlaceholder")}
                    className={inputCls}
                  />
                  <button
                    type="button"
                    aria-label={t("studio.produk.removeVariant")}
                    onClick={() => setVariants(variants.filter((_, j) => j !== i))}
                    className="grid h-10 w-10 shrink-0 place-items-center rounded-lg border border-yt-outline text-yt-text2 hover:text-red-500"
                  >
                    <X size={16} />
                  </button>
                </div>
              ))}
            </div>
            <button
              type="button"
              onClick={() => setVariants([...variants, { name: "", optionsText: "" }])}
              className="mt-2 flex h-9 items-center gap-1.5 rounded-full border border-yt-outline px-3 text-sm font-medium hover:bg-yt-hover"
            >
              <Plus size={16} /> {t("studio.produk.addVariant")}
            </button>
          </div>

          <div>
            <span className="mb-1.5 block text-sm font-medium">
              {t("studio.produk.labelContentLink")}
            </span>
            <Select
              value={postId}
              options={postOptions}
              onChange={setPostId}
              ariaLabel={t("studio.produk.contentLinkAria")}
            />
          </div>
        </div>
      </div>

      <div className="flex items-center gap-3 pt-2">
        <button
          type="submit"
          disabled={pending}
          className="h-10 rounded-full bg-yt-cta px-5 text-sm font-medium text-white disabled:opacity-50"
        >
          {pending ? t("studio.produk.saving") : t("studio.produk.save")}
        </button>
        {defaults?.id && (
          <button
            type="button"
            onClick={remove}
            disabled={pending}
            className="flex h-10 items-center gap-2 rounded-full border border-yt-outline px-5 text-sm font-medium text-red-500 hover:bg-yt-hover disabled:opacity-50"
          >
            <Trash2 size={16} /> {t("common.delete")}
          </button>
        )}
      </div>

      {defaults?.id && (
        <div className="pt-2">
          <ProductFiles productId={defaults.id} />
        </div>
      )}
    </form>
  );
}
