"use client";

import { Check, Minus, Pencil, Trash2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { toast } from "sonner";
import { deletePageAction } from "@/app/(studio)/studio/pages/actions";
import { askConfirm } from "@/components/ui/dialog";

type Row = {
  id: string;
  title: string;
  slug: string;
  status: "DRAFT" | "PUBLISHED";
  showInFooter: boolean;
};

export default function PagesList({ pages }: { pages: Row[] }) {
  const router = useRouter();
  const [pending, start] = useTransition();

  async function remove(row: Row) {
    const ok = await askConfirm({
      title: `Hapus halaman "${row.title}"?`,
      body: "Halaman akan dihapus permanen.",
      confirmLabel: "Hapus",
      danger: true,
    });
    if (!ok) return;
    start(async () => {
      await deletePageAction(row.id);
      toast.success("Halaman dihapus.");
      router.refresh();
    });
  }

  if (pages.length === 0) {
    return (
      <p className="py-16 text-center text-sm text-yt-text2">
        Belum ada halaman. Klik tombol Buat halaman untuk mulai.
      </p>
    );
  }

  return (
    <div className="overflow-x-auto rounded-xl border border-yt-outline">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-yt-outline/60 text-left text-xs text-yt-text2">
            <th className="px-4 py-3 font-medium">Judul</th>
            <th className="px-4 py-3 font-medium">Slug</th>
            <th className="px-4 py-3 font-medium">Status</th>
            <th className="px-4 py-3 font-medium">Footer</th>
            <th className="px-4 py-3 font-medium" />
          </tr>
        </thead>
        <tbody>
          {pages.map((p) => (
            <tr
              key={p.id}
              className="border-b border-yt-outline/60 last:border-b-0 hover:bg-yt-hover"
            >
              <td className="px-4 py-3">
                <Link href={`/studio/pages/${p.id}`} className="font-medium hover:text-yt-cta">
                  {p.title}
                </Link>
              </td>
              <td className="px-4 py-3 text-yt-text2">/{p.slug}</td>
              <td className="px-4 py-3">
                <span
                  className={`rounded-full px-2.5 py-1 text-xs ${
                    p.status === "PUBLISHED"
                      ? "bg-green-500/15 text-green-600 dark:text-green-400"
                      : "bg-yt-chip text-yt-text2"
                  }`}
                >
                  {p.status === "PUBLISHED" ? "Terbit" : "Draf"}
                </span>
              </td>
              <td className="px-4 py-3 text-yt-text2">
                {p.showInFooter ? <Check size={16} /> : <Minus size={16} />}
              </td>
              <td className="px-4 py-3">
                <div className="flex items-center justify-end gap-1">
                  <Link
                    href={`/studio/pages/${p.id}`}
                    aria-label={`Edit ${p.title}`}
                    title="Edit"
                    className="grid h-8 w-8 place-items-center rounded-full text-yt-text2 hover:bg-yt-hover hover:text-yt-text"
                  >
                    <Pencil size={16} />
                  </Link>
                  <button
                    type="button"
                    onClick={() => remove(p)}
                    disabled={pending}
                    aria-label={`Hapus ${p.title}`}
                    title="Hapus"
                    className="grid h-8 w-8 place-items-center rounded-full text-yt-text2 hover:bg-yt-hover hover:text-red-500 disabled:opacity-50"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
