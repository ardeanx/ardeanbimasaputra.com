"use client";

import { X } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import Select, { type SelectOption } from "@/components/ui/Select";

export type ToolbarFilter = {
  param: string;
  ariaLabel: string;
  value: string;
  def: string;
  options: SelectOption[];
  chip?: boolean;
};

export default function StoreToolbar({ filters }: { filters: ToolbarFilter[] }) {
  const router = useRouter();
  const sp = useSearchParams();

  function setParam(param: string, value: string, def: string) {
    const q = new URLSearchParams(sp.toString());
    if (value === def) q.delete(param);
    else q.set(param, value);
    const s = q.toString();
    router.push(s ? `?${s}` : "?", { scroll: false });
  }

  const chips = filters.filter((f) => f.chip && f.value !== f.def);

  return (
    <div className="mt-6">
      <div className="flex flex-wrap items-center gap-2">
        {filters.map((f) => (
          <Select
            key={f.param}
            ariaLabel={f.ariaLabel}
            value={f.value}
            options={f.options}
            onChange={(v) => setParam(f.param, v, f.def)}
            className="w-44 max-w-[48vw]"
          />
        ))}
      </div>
      {chips.length > 0 && (
        <div className="mt-3 flex flex-wrap items-center gap-2">
          {chips.map((f) => {
            const opt = f.options.find((o) => o.value === f.value);
            return (
              <button
                key={f.param}
                type="button"
                onClick={() => setParam(f.param, f.def, f.def)}
                className="flex items-center gap-1.5 rounded-full bg-yt-chip px-3 py-1 text-sm text-yt-text hover:bg-yt-chip-hover"
              >
                <span className="truncate">{opt?.label ?? f.value}</span>
                <X size={14} className="shrink-0 text-yt-text2" />
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
