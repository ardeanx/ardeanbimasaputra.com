"use client";

import { useEffect, useRef } from "react";

export default function Mermaid({ code }: { code: string }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    let alive = true;
    if (!code.trim()) return;
    void (async () => {
      const mermaid = (await import("mermaid")).default;
      const dark = document.documentElement.classList.contains("dark");
      mermaid.initialize({
        startOnLoad: false,
        securityLevel: "strict",
        theme: dark ? "dark" : "default",
      });
      try {
        const { svg } = await mermaid.render(`pm${Math.random().toString(36).slice(2)}`, code);
        if (alive && ref.current) ref.current.innerHTML = svg;
      } catch (err) {
        if (alive && ref.current) ref.current.textContent = String(err);
      }
    })();
    return () => {
      alive = false;
    };
  }, [code]);
  return <div ref={ref} className="mermaid-block my-4" />;
}
