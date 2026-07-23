"use client";

import { icons } from "lucide-react";
import { useMemo, useState } from "react";
import { useT } from "@/components/i18n/I18nProvider";
import { inputCls } from "./forms";

export type IconValue = { icon: string; iconType: "lucide" | "image" };

const NAMES = Object.keys(icons) as (keyof typeof icons)[];

async function uploadFile(file: File): Promise<string> {
  const form = new FormData();
  form.append("file", file);
  const res = await fetch("/api/uploads", { method: "POST", body: form });
  if (res.status !== 201) throw new Error("upload");
  return (await res.json()).url as string;
}

export default function IconPicker({
  value,
  onChange,
}: {
  value: IconValue;
  onChange: (v: IconValue) => void;
}) {
  const t = useT();
  const [mode, setMode] = useState<IconValue["iconType"]>(value.iconType);
  const [q, setQ] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const results = useMemo(() => {
    const s = q.trim().toLowerCase();
    const list = s ? NAMES.filter((n) => n.toLowerCase().includes(s)) : NAMES;
    return list.slice(0, 60);
  }, [q]);

  async function onFile(file: File | undefined) {
    if (!file) return;
    setErr(null);
    setBusy(true);
    try {
      const url = await uploadFile(file);
      onChange({ icon: url, iconType: "image" });
    } catch {
      setErr(t("settings.uploadFailed"));
    } finally {
      setBusy(false);
    }
  }

  const Selected = value.iconType === "lucide" ? icons[value.icon as keyof typeof icons] : null;

  return (
    <div>
      <div className="mb-2 flex items-center gap-2">
        <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg border border-yt-outline">
          {value.iconType === "image" && value.icon ? (
            <img src={value.icon} alt="" className="h-5 w-5 object-contain" />
          ) : Selected ? (
            <Selected size={18} />
          ) : null}
        </span>
        <div className="flex rounded-lg border border-yt-outline p-0.5 text-xs">
          <button
            type="button"
            onClick={() => setMode("lucide")}
            className={`rounded-md px-2.5 py-1 ${
              mode === "lucide" ? "bg-yt-active font-medium" : "text-yt-text2"
            }`}
          >
            {t("settings.menu.iconLibrary")}
          </button>
          <button
            type="button"
            onClick={() => setMode("image")}
            className={`rounded-md px-2.5 py-1 ${
              mode === "image" ? "bg-yt-active font-medium" : "text-yt-text2"
            }`}
          >
            {t("settings.menu.iconUpload")}
          </button>
        </div>
      </div>

      {mode === "lucide" ? (
        <div>
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder={t("settings.menu.iconSearch")}
            aria-label={t("settings.menu.iconSearch")}
            className={inputCls}
          />
          <div className="mt-2 grid max-h-40 grid-cols-8 gap-1 overflow-y-auto">
            {results.map((n) => {
              const I = icons[n];
              const active = value.iconType === "lucide" && value.icon === n;
              return (
                <button
                  key={n}
                  type="button"
                  title={n}
                  aria-label={n}
                  onClick={() => onChange({ icon: n, iconType: "lucide" })}
                  className={`grid aspect-square place-items-center rounded-md border hover:bg-yt-hover ${
                    active ? "border-yt-cta" : "border-transparent"
                  }`}
                >
                  <I size={18} />
                </button>
              );
            })}
          </div>
        </div>
      ) : (
        <div>
          <label
            className={`grid h-24 w-full cursor-pointer place-items-center rounded-lg border border-dashed border-yt-outline text-center text-xs text-yt-text2 hover:bg-yt-hover ${
              busy ? "opacity-60" : ""
            }`}
          >
            {busy ? (
              t("common.saving")
            ) : value.iconType === "image" && value.icon ? (
              <img src={value.icon} alt="" className="h-12 w-12 object-contain" />
            ) : (
              <span className="px-3">{t("settings.menu.iconUploadHint")}</span>
            )}
            <input
              type="file"
              accept="image/svg+xml,image/png,image/jpeg,image/webp"
              hidden
              onChange={(e) => onFile(e.target.files?.[0])}
            />
          </label>
          {err && <p className="mt-1 text-xs text-red-500">{err}</p>}
        </div>
      )}
    </div>
  );
}
