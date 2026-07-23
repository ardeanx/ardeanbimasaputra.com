"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";

export default function StudioTabs({
  tabs,
  param = "view",
}: {
  tabs: { key: string; label: string }[];
  param?: string;
}) {
  const pathname = usePathname();
  const sp = useSearchParams();
  const active = sp.get(param) ?? tabs[0].key;

  return (
    <div className="mb-6 flex gap-6 border-b border-yt-outline text-[15px] font-medium text-yt-text2">
      {tabs.map((t, i) => {
        const next = new URLSearchParams(sp.toString());
        if (i === 0) next.delete(param);
        else next.set(param, t.key);
        const qs = next.toString();
        return (
          <Link
            key={t.key}
            href={qs ? `${pathname}?${qs}` : pathname}
            className={`-mb-px border-b-2 pb-2.5 ${
              active === t.key
                ? "border-yt-text text-yt-text"
                : "border-transparent hover:text-yt-text"
            }`}
          >
            {t.label}
          </Link>
        );
      })}
    </div>
  );
}
