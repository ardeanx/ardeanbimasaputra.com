"use client";

import { Pencil, Plus, Tag, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import {
  addCategoryAction,
  deleteCategoryAction,
  renameCategoryAction,
} from "@/app/(studio)/studio/categories/actions";
import { useT } from "@/components/i18n/I18nProvider";
import { askConfirm, askInput } from "@/components/ui/dialog";

type Category = {
  id: number;
  name: string;
  slug: string;
  postCount: number;
};

export default function CategoriesManager({ categories }: { categories: Category[] }) {
  const t = useT();
  const router = useRouter();
  const [pending, start] = useTransition();
  const [name, setName] = useState("");

  function add() {
    const trimmed = name.trim();
    if (!trimmed) {
      toast.error(t("studio.categories.nameRequired"));
      return;
    }
    start(async () => {
      const res = await addCategoryAction(trimmed);
      if ("error" in res) {
        toast.error(res.error);
        return;
      }
      toast.success(t("studio.categories.added"));
      setName("");
      router.refresh();
    });
  }

  async function rename(cat: Category) {
    const next = await askInput({
      title: t("studio.categories.renameTitle"),
      placeholder: t("studio.categories.namePlaceholder"),
      initial: cat.name,
      confirmLabel: t("common.save"),
    });
    if (next === null || next.trim() === "" || next.trim() === cat.name) return;
    start(async () => {
      const res = await renameCategoryAction(cat.id, next.trim());
      if ("error" in res) {
        toast.error(res.error);
        return;
      }
      toast.success(t("studio.categories.renamed"));
      router.refresh();
    });
  }

  async function remove(cat: Category) {
    const ok = await askConfirm({
      title: t("studio.categories.deleteTitle", { name: cat.name }),
      body:
        cat.postCount > 0
          ? t("studio.categories.deleteBodyUsed", { count: cat.postCount })
          : t("studio.categories.deleteBodyUnused"),
      confirmLabel: t("common.delete"),
      danger: true,
    });
    if (!ok) return;
    start(async () => {
      const res = await deleteCategoryAction(cat.id);
      if ("error" in res) {
        toast.error(res.error);
        return;
      }
      toast.success(t("studio.categories.deleted"));
      router.refresh();
    });
  }

  return (
    <div className="space-y-6">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          add();
        }}
        className="flex items-center gap-3 rounded-xl border border-yt-outline bg-yt-raised p-4"
      >
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          maxLength={40}
          placeholder={t("studio.categories.newPlaceholder")}
          aria-label={t("studio.categories.newPlaceholder")}
          className="min-w-0 flex-1 rounded-lg border border-yt-outline bg-transparent px-3 py-2 text-sm text-yt-text outline-none placeholder:text-yt-text2 focus:border-yt-cta"
        />
        <button
          type="submit"
          disabled={pending}
          className="flex shrink-0 items-center gap-2 rounded-full bg-yt-cta px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
        >
          <Plus size={16} />
          {t("studio.categories.add")}
        </button>
      </form>

      <div className="rounded-xl border border-yt-outline bg-yt-raised">
        {categories.length === 0 ? (
          <p className="p-6 text-center text-sm text-yt-text2">{t("studio.categories.empty")}</p>
        ) : (
          categories.map((cat, i) => (
            <div
              key={cat.id}
              className={`flex items-center gap-3 px-4 py-3 ${
                i < categories.length - 1 ? "border-b border-yt-outline/60" : ""
              }`}
            >
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-yt-chip text-yt-text2">
                <Tag size={16} />
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-yt-text">{cat.name}</p>
                <p className="truncate text-xs text-yt-text2">
                  /{cat.slug} · {t("studio.categories.contentCount", { count: cat.postCount })}
                </p>
              </div>
              <button
                type="button"
                onClick={() => rename(cat)}
                disabled={pending}
                aria-label={t("studio.categories.renameAria", { name: cat.name })}
                title={t("studio.categories.rename")}
                className="rounded-full p-2 text-yt-text2 hover:bg-yt-hover hover:text-yt-text disabled:opacity-50"
              >
                <Pencil size={16} />
              </button>
              <button
                type="button"
                onClick={() => remove(cat)}
                disabled={pending}
                aria-label={t("studio.categories.deleteAria", { name: cat.name })}
                title={t("common.delete")}
                className="rounded-full p-2 text-yt-text2 hover:bg-yt-hover hover:text-red-500 disabled:opacity-50"
              >
                <Trash2 size={16} />
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
