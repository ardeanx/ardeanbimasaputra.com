"use client";

import {
  addLocaleAction,
  autoTranslateAction,
  saveLocaleAction,
} from "@/app/(studio)/studio/languages/actions";
import { askInput } from "@/components/ui/dialog";
import { Plus, Save, Search, Sparkles } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { toast } from "sonner";

const CODE_RE = /^[a-z]{2}(-[a-z]{2})?$/i;

export default function LanguageManager({
  locales,
  dicts,
}: {
  locales: string[];
  dicts: Record<string, Record<string, string>>;
}) {
  const router = useRouter();
  const [selected, setSelected] = useState<string | null>(null);
  const [entries, setEntries] = useState<Record<string, string>>({});
  const [q, setQ] = useState("");
  const [pending, startTransition] = useTransition();

  const enDict = dicts.en ?? {};
  const enKeys = Object.keys(enDict).sort();
  const total = enKeys.length;

  function filledOf(code: string): number {
    const d = dicts[code] ?? {};
    return enKeys.filter((k) => (d[k] ?? "").trim()).length;
  }

  function open(code: string) {
    setSelected(code);
    setEntries({ ...dicts[code] });
    setQ("");
  }

  async function addLocale() {
    const code = await askInput({
      title: "Tambah Bahasa",
      placeholder: "Kode locale, contoh: fr atau pt-br",
      confirmLabel: "Tambah",
    });
    if (code === null) return;
    const lower = code.trim().toLowerCase();
    if (!CODE_RE.test(lower)) {
      toast.error("Kode locale tidak valid (contoh: fr, pt-br).");
      return;
    }
    startTransition(async () => {
      const res = await addLocaleAction(lower);
      if ("error" in res) {
        toast.error(res.error);
      } else {
        toast.success(`Bahasa "${lower}" ditambahkan.`);
        setSelected(lower);
        setEntries({});
        setQ("");
        router.refresh();
      }
    });
  }

  function save() {
    if (!selected) return;
    const code = selected;
    startTransition(async () => {
      const res = await saveLocaleAction(code, entries);
      if ("error" in res) toast.error(res.error);
      else {
        toast.success("Terjemahan disimpan.");
        router.refresh();
      }
    });
  }

  function autoTranslate() {
    if (!selected) return;
    const code = selected;
    startTransition(async () => {
      const res = await autoTranslateAction(code, entries);
      if ("error" in res) {
        toast.error(res.error);
      } else {
        setEntries({ ...res.dict });
        toast.success(
          res.filled > 0 ? `${res.filled} kunci terisi otomatis.` : "Semua kunci sudah terisi.",
        );
        router.refresh();
      }
    });
  }

  const needle = q.trim().toLowerCase();
  const visible = enKeys.filter(
    (k) =>
      !needle ||
      k.toLowerCase().includes(needle) ||
      (enDict[k] ?? "").toLowerCase().includes(needle) ||
      (entries[k] ?? "").toLowerCase().includes(needle),
  );

  const isEn = selected === "en";

  return (
    <div>
      <div className="flex flex-wrap items-center gap-2">
        {locales.map((code) => {
          const active = code === selected;
          return (
            <button
              key={code}
              type="button"
              onClick={() => open(code)}
              className={`flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-medium ${
                active
                  ? "border-yt-cta bg-yt-hover text-yt-text"
                  : "border-yt-outline text-yt-text2 hover:bg-yt-hover"
              }`}
            >
              <span className="uppercase">{code}</span>
              <span className="text-xs text-yt-text2">
                {filledOf(code)}/{total}
              </span>
            </button>
          );
        })}
        <button
          type="button"
          onClick={addLocale}
          disabled={pending}
          className="flex items-center gap-1.5 rounded-full border border-dashed border-yt-outline px-4 py-2 text-sm font-medium text-yt-text2 hover:bg-yt-hover disabled:opacity-60"
        >
          <Plus width={16} height={16} />
          Tambah Bahasa
        </button>
      </div>

      {selected === null ? (
        <p className="py-16 text-center text-sm text-yt-text2">
          Pilih bahasa untuk menyunting terjemahannya.
        </p>
      ) : (
        <div className="mt-6">
          <div className="mb-4 flex flex-wrap items-center gap-3">
            <div className="flex h-9 flex-1 items-center gap-2 rounded-full border border-yt-outline px-3">
              <Search width={16} height={16} className="shrink-0 text-yt-text2" />
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Cari kunci atau teks"
                className="w-full bg-transparent text-sm outline-none placeholder:text-yt-text2"
              />
            </div>
            {!isEn && (
              <button
                type="button"
                onClick={autoTranslate}
                disabled={pending}
                className="flex h-9 items-center gap-2 rounded-full border border-yt-outline px-4 text-sm font-medium hover:bg-yt-hover disabled:opacity-60"
              >
                <Sparkles width={16} height={16} />
                Terjemahkan otomatis
              </button>
            )}
            <button
              type="button"
              onClick={save}
              disabled={pending}
              className="flex h-9 items-center gap-2 rounded-full bg-yt-cta px-4 text-sm font-medium text-white hover:brightness-110 disabled:opacity-60"
            >
              <Save width={16} height={16} />
              Simpan
            </button>
          </div>

          {total === 0 ? (
            <p className="py-16 text-center text-sm text-yt-text2">
              Belum ada kunci terjemahan di en.json.
            </p>
          ) : (
            <div className="overflow-hidden rounded-xl border border-yt-outline/60">
              <div
                className={`grid gap-3 border-b border-yt-outline/60 bg-yt-hover/50 px-3 py-2 text-xs font-medium text-yt-text2 ${
                  isEn ? "grid-cols-2" : "grid-cols-3"
                }`}
              >
                <span>Kunci</span>
                {!isEn && <span>Nilai en (referensi)</span>}
                <span>Nilai {selected}</span>
              </div>
              {visible.length === 0 ? (
                <p className="px-3 py-8 text-center text-sm text-yt-text2">
                  Tidak ada kunci yang cocok.
                </p>
              ) : (
                visible.map((k) => {
                  const val = entries[k] ?? "";
                  const empty = !val.trim();
                  return (
                    <div
                      key={k}
                      className={`grid items-start gap-3 border-b border-yt-outline/40 px-3 py-2 last:border-b-0 ${
                        isEn ? "grid-cols-2" : "grid-cols-3"
                      }`}
                    >
                      <span className="break-all pt-2 font-mono text-xs text-yt-text2">{k}</span>
                      {!isEn && (
                        <span className="min-w-0 break-words pt-1.5 text-sm text-yt-text2">
                          {enDict[k]}
                        </span>
                      )}
                      <input
                        value={val}
                        onChange={(e) => setEntries((prev) => ({ ...prev, [k]: e.target.value }))}
                        placeholder={isEn ? "" : "Belum diterjemahkan"}
                        className={`w-full rounded-lg border bg-transparent px-3 py-1.5 text-sm outline-none focus:border-yt-cta ${
                          empty ? "border-yellow-500/70" : "border-yt-outline"
                        }`}
                      />
                    </div>
                  );
                })
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
