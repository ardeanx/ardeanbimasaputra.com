"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useT } from "@/components/i18n/I18nProvider";

function Chip({ href, label, active }: { href: string; label: string; active: boolean }) {
  return (
    <Link
      href={href}
      className={`h-8 shrink-0 whitespace-nowrap rounded-lg px-3 text-sm font-medium leading-8 ${
        active ? "bg-yt-btn text-yt-btn-text" : "bg-yt-chip hover:bg-yt-chip-hover"
      }`}
    >
      {label}
    </Link>
  );
}

export function ChipRow({
  cats,
  active,
}: {
  cats: { name: string; slug: string }[];
  active: string | null;
}) {
  const t = useT();
  return (
    <div className="no-scrollbar flex gap-3 overflow-x-auto px-6 py-3">
      <Chip href="/" label={t("chips.all")} active={!active} />
      {cats.map((c) => (
        <Chip key={c.slug} href={`/?c=${c.slug}`} label={c.name} active={active === c.slug} />
      ))}
    </div>
  );
}

export default function Chips({ cats }: { cats: { name: string; slug: string }[] }) {
  const active = useSearchParams().get("c");
  return <ChipRow cats={cats} active={active} />;
}
