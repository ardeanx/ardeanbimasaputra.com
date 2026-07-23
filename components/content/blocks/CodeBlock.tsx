"use client";

import { Check, Copy, FileCode2 } from "lucide-react";
import { useRef, useState } from "react";
import { useT } from "@/components/i18n/I18nProvider";

async function copyText(text: string): Promise<boolean> {
  if (navigator.clipboard?.writeText) {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch {}
  }
  const ta = document.createElement("textarea");
  ta.value = text;
  ta.style.position = "fixed";
  ta.style.opacity = "0";
  document.body.appendChild(ta);
  ta.select();
  let ok = false;
  try {
    ok = document.execCommand("copy");
  } catch {}
  ta.remove();
  return ok;
}

export default function CodeBlock({
  html,
  filename,
  lang,
}: {
  html?: string;
  filename?: string | null;
  lang?: string | null;
}) {
  const t = useT();
  const [copied, setCopied] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const label = lang || filename?.split(".").pop()?.toLowerCase() || "text";

  async function copy() {
    const text = ref.current?.textContent ?? "";
    if (await copyText(text)) {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    }
  }

  return (
    <div className="codeblock my-4">
      <div className="codeblock-head">
        <FileCode2 size={14} className="codeblock-fileicon" aria-hidden />
        {filename && <span className="codeblock-file-label">{filename}</span>}
        <span className="codeblock-lang">{label}</span>
        <button
          type="button"
          onClick={copy}
          className="codeblock-copy"
          aria-label={t("code.copyAria")}
        >
          {copied ? <Check size={13} /> : <Copy size={13} />}
          {copied ? t("code.copied") : t("code.copy")}
        </button>
      </div>
      <div ref={ref} className="codeblock-body" dangerouslySetInnerHTML={{ __html: html ?? "" }} />
    </div>
  );
}
