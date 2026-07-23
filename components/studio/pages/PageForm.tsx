"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import { savePageAction } from "@/app/(studio)/studio/pages/actions";
import MediaPicker from "@/components/studio/MediaPicker";
import Select from "@/components/ui/Select";
import PageBodyEditor from "./PageBodyEditor";

type PageData = {
  id: string;
  slug: string;
  title: string;
  body: unknown;
  status: "DRAFT" | "PUBLISHED";
  seoTitle: string | null;
  seoDescription: string | null;
  ogImage: string | null;
  showInFooter: boolean;
  sortOrder: number;
};

function slugify(s: string): string {
  return s
    .toLowerCase()
    .trim()
    .replace(/[^\p{L}\p{N}]+/gu, "-")
    .replace(/^-+|-+$/g, "");
}

const field =
  "w-full rounded-lg border border-yt-outline bg-transparent px-3 py-2 text-sm text-yt-text outline-none placeholder:text-yt-text2 focus:border-yt-cta";

export default function PageForm({ page }: { page?: PageData | null }) {
  const router = useRouter();
  const [pending, start] = useTransition();

  const [title, setTitle] = useState(page?.title ?? "");
  const [slug, setSlug] = useState(page?.slug ?? "");
  const [slugTouched, setSlugTouched] = useState(Boolean(page));
  const [status, setStatus] = useState<"DRAFT" | "PUBLISHED">(page?.status ?? "DRAFT");
  const [showInFooter, setShowInFooter] = useState(page?.showInFooter ?? true);
  const [sortOrder, setSortOrder] = useState(String(page?.sortOrder ?? 0));
  const [seoTitle, setSeoTitle] = useState(page?.seoTitle ?? "");
  const [seoDescription, setSeoDescription] = useState(page?.seoDescription ?? "");
  const [ogImage, setOgImage] = useState<string | null>(page?.ogImage ?? null);
  const [body, setBody] = useState<unknown>(page?.body ?? null);

  function onTitle(v: string) {
    setTitle(v);
    if (!slugTouched) setSlug(slugify(v));
  }

  function submit() {
    if (!title.trim()) {
      toast.error("Judul wajib diisi.");
      return;
    }
    start(async () => {
      const res = await savePageAction({
        id: page?.id,
        title: title.trim(),
        slug: slug.trim() || title.trim(),
        body: body ?? { type: "doc", content: [{ type: "paragraph" }] },
        status,
        seoTitle: seoTitle.trim() || null,
        seoDescription: seoDescription.trim() || null,
        ogImage: ogImage || null,
        showInFooter,
        sortOrder: Number(sortOrder) || 0,
      });
      if ("error" in res) {
        toast.error(res.error);
        return;
      }
      toast.success("Halaman disimpan.");
      router.push("/studio/pages");
      router.refresh();
    });
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
      <div className="space-y-4">
        <div>
          <label className="mb-1 block text-sm font-medium" htmlFor="page-title">
            Judul
          </label>
          <input
            id="page-title"
            value={title}
            onChange={(e) => onTitle(e.target.value)}
            placeholder="Judul halaman"
            className={field}
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium" htmlFor="page-slug">
            Slug
          </label>
          <div className="flex items-center gap-2">
            <span className="text-sm text-yt-text2">/</span>
            <input
              id="page-slug"
              value={slug}
              onChange={(e) => {
                setSlugTouched(true);
                setSlug(e.target.value);
              }}
              placeholder="tautan-halaman"
              className={field}
            />
          </div>
        </div>

        <div>
          <span className="mb-1 block text-sm font-medium">Isi halaman</span>
          <PageBodyEditor value={body} onChange={setBody} />
        </div>
      </div>

      <aside className="space-y-5">
        <div className="rounded-xl border border-yt-outline bg-yt-raised p-4">
          <div className="flex gap-2">
            <button
              type="button"
              onClick={submit}
              disabled={pending}
              className="flex-1 rounded-full bg-yt-cta px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
            >
              {pending ? "Menyimpan…" : "Simpan"}
            </button>
            <button
              type="button"
              onClick={() => router.push("/studio/pages")}
              className="rounded-full px-4 py-2 text-sm font-medium text-yt-text2 hover:bg-yt-hover"
            >
              Batal
            </button>
          </div>
        </div>

        <div className="space-y-4 rounded-xl border border-yt-outline bg-yt-raised p-4">
          <div>
            <span className="mb-1 block text-sm font-medium">Status</span>
            <Select
              ariaLabel="Status halaman"
              value={status}
              onChange={(v) => setStatus(v as "DRAFT" | "PUBLISHED")}
              options={[
                { value: "DRAFT", label: "Draf" },
                { value: "PUBLISHED", label: "Terbit" },
              ]}
              buttonClassName="flex h-9 w-full items-center justify-between gap-2 rounded-lg border border-yt-outline px-3 text-sm hover:bg-yt-hover"
              menuClassName="w-full"
            />
          </div>

          <label className="flex items-center justify-between text-sm">
            <span className="font-medium">Tampilkan di footer</span>
            <input
              type="checkbox"
              checked={showInFooter}
              onChange={(e) => setShowInFooter(e.target.checked)}
              className="h-4 w-4 accent-[var(--yt-cta)]"
            />
          </label>

          <div>
            <label className="mb-1 block text-sm font-medium" htmlFor="page-sort">
              Urutan
            </label>
            <input
              id="page-sort"
              type="number"
              value={sortOrder}
              onChange={(e) => setSortOrder(e.target.value)}
              className={field}
            />
          </div>
        </div>

        <div className="space-y-4 rounded-xl border border-yt-outline bg-yt-raised p-4">
          <p className="text-sm font-medium">SEO</p>
          <div>
            <label className="mb-1 block text-xs text-yt-text2" htmlFor="page-seotitle">
              Judul SEO
            </label>
            <input
              id="page-seotitle"
              value={seoTitle}
              onChange={(e) => setSeoTitle(e.target.value)}
              placeholder={title || "Judul untuk mesin pencari"}
              className={field}
            />
          </div>
          <div>
            <label className="mb-1 block text-xs text-yt-text2" htmlFor="page-seodesc">
              Deskripsi SEO
            </label>
            <textarea
              id="page-seodesc"
              value={seoDescription}
              onChange={(e) => setSeoDescription(e.target.value)}
              rows={3}
              placeholder="Ringkasan singkat halaman"
              className={`${field} resize-y`}
            />
          </div>
          <div>
            <span className="mb-1 block text-xs text-yt-text2">Gambar OG</span>
            <MediaPicker value={ogImage} onChange={setOgImage} />
          </div>
        </div>
      </aside>
    </div>
  );
}
