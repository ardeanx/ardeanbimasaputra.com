"use client";

import { useEffect, useRef } from "react";

type TurnstileApi = {
  render: (el: HTMLElement, opts: { sitekey: string; theme?: string }) => string;
  remove: (id: string) => void;
  getResponse: (id?: string) => string;
  reset: (id?: string) => void;
};

declare global {
  interface Window {
    turnstile?: TurnstileApi;
  }
}

const SCRIPT_SRC = "https://challenges.cloudflare.com/turnstile/v0/api.js";

export function Turnstile({ siteKey }: { siteKey: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const idRef = useRef<string | null>(null);

  useEffect(() => {
    if (!siteKey) return;
    let active = true;

    function render() {
      if (!active || !window.turnstile || !ref.current || idRef.current) return;
      idRef.current = window.turnstile.render(ref.current, {
        sitekey: siteKey,
        theme: "auto",
      });
    }

    if (window.turnstile) {
      render();
    } else if (!document.querySelector(`script[src="${SCRIPT_SRC}"]`)) {
      const s = document.createElement("script");
      s.src = SCRIPT_SRC;
      s.async = true;
      document.head.appendChild(s);
    }

    const iv = window.setInterval(() => {
      if (idRef.current) {
        window.clearInterval(iv);
        return;
      }
      render();
    }, 200);

    return () => {
      active = false;
      window.clearInterval(iv);
      if (idRef.current && window.turnstile) {
        try {
          window.turnstile.remove(idRef.current);
        } catch {}
      }
      idRef.current = null;
    };
  }, [siteKey]);

  if (!siteKey) return null;
  return <div ref={ref} />;
}

export function turnstileToken(): string {
  if (window.turnstile) {
    try {
      const r = window.turnstile.getResponse();
      if (r) return r;
    } catch {}
  }
  const el = document.querySelector('input[name="cf-turnstile-response"]');
  return el instanceof HTMLInputElement ? el.value : "";
}
