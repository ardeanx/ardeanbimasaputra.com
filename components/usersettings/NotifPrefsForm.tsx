"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { saveNotifPrefsAction } from "@/app/(shell)/settings/actions";
import type { NotifPrefs } from "@/lib/notification-prefs";

const FIELDS: { key: keyof NotifPrefs; label: string; hint: string }[] = [
  {
    key: "comments",
    label: "Komentar di konten saya",
    hint: "Saat ada yang mengomentari konten Anda.",
  },
  {
    key: "replies",
    label: "Balasan",
    hint: "Saat ada yang membalas komentar Anda.",
  },
  {
    key: "follows",
    label: "Pengikut baru",
    hint: "Saat ada yang mulai mengikuti Anda.",
  },
  {
    key: "newContent",
    label: "Konten baru dari yang diikuti",
    hint: "Saat kreator yang Anda ikuti menerbitkan konten.",
  },
];

export default function NotifPrefsForm({ initial }: { initial: NotifPrefs }) {
  const [value, setValue] = useState(initial);
  const [saved, setSaved] = useState(initial);
  const [pending, startTransition] = useTransition();
  const dirty = JSON.stringify(value) !== JSON.stringify(saved);

  function toggle(key: keyof NotifPrefs) {
    setValue((s) => ({ ...s, [key]: !s[key] }));
  }

  function save() {
    startTransition(async () => {
      const res = await saveNotifPrefsAction(value);
      if ("error" in res) {
        toast.error(res.error);
      } else {
        setSaved(value);
        toast.success("Preferensi notifikasi disimpan.");
      }
    });
  }

  return (
    <section className="rounded-xl border border-yt-outline bg-yt-raised p-5">
      <h2 className="text-base font-semibold">Notifikasi</h2>
      <p className="mt-1 text-sm text-yt-text2">
        Pilih peristiwa yang ingin Anda terima notifikasinya.
      </p>
      <div className="mt-4 divide-y divide-yt-outline">
        {FIELDS.map((f) => (
          <div key={f.key} className="flex items-center justify-between gap-4 py-3">
            <div className="min-w-0">
              <p className="text-sm font-medium">{f.label}</p>
              <p className="text-xs text-yt-text2">{f.hint}</p>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={value[f.key]}
              aria-label={f.label}
              onClick={() => toggle(f.key)}
              className={`relative h-6 w-11 shrink-0 rounded-full transition ${
                value[f.key] ? "bg-yt-cta" : "bg-yt-outline"
              }`}
            >
              <span
                className={`absolute top-0.5 h-5 w-5 rounded-full bg-white transition ${
                  value[f.key] ? "left-[22px]" : "left-0.5"
                }`}
              />
            </button>
          </div>
        ))}
      </div>
      <div className="mt-4 flex justify-end">
        <button
          type="button"
          onClick={save}
          disabled={!dirty || pending}
          className="h-10 rounded-full bg-yt-cta px-5 text-sm font-medium text-white disabled:opacity-50"
        >
          {pending ? "Menyimpan..." : "Simpan"}
        </button>
      </div>
    </section>
  );
}
