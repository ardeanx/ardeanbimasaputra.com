"use client";

import { useEffect, useRef } from "react";

export default function AdSlot({ code }: { code: string }) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.innerHTML = code;
    for (const old of Array.from(el.querySelectorAll("script"))) {
      const s = document.createElement("script");
      for (const a of Array.from(old.attributes)) {
        s.setAttribute(a.name, a.value);
      }
      s.text = old.text;
      old.replaceWith(s);
    }
    return () => {
      el.innerHTML = "";
    };
  }, [code]);

  return (
    <div className="my-6">
      <p className="mb-1 text-[11px] uppercase tracking-wide text-yt-text2">Iklan</p>
      <div ref={ref} />
    </div>
  );
}
