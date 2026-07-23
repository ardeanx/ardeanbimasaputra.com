"use client";

import { ArrowLeft } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useT } from "@/components/i18n/I18nProvider";
import { HistoryIcon, MicIcon, SearchIcon } from "./icons";

type SpeechRecognitionLike = {
  lang: string;
  onresult:
    ((e: { results: { [i: number]: { [j: number]: { transcript: string } } } }) => void) | null;
  onend: (() => void) | null;
  onerror: (() => void) | null;
  start: () => void;
};

export function startVoiceSearch(opts: {
  onText: (text: string) => void;
  onStart: () => void;
  onEnd: () => void;
  onUnsupported: () => void;
  onError: () => void;
}) {
  const w = window as unknown as {
    webkitSpeechRecognition?: new () => SpeechRecognitionLike;
    SpeechRecognition?: new () => SpeechRecognitionLike;
  };
  const Ctor = w.SpeechRecognition ?? w.webkitSpeechRecognition;
  if (!Ctor) {
    opts.onUnsupported();
    return;
  }
  const rec = new Ctor();
  rec.lang = "id-ID";
  opts.onStart();
  rec.onresult = (e) => {
    const text = e.results[0]?.[0]?.transcript ?? "";
    if (text) opts.onText(text);
  };
  rec.onerror = () => opts.onError();
  rec.onend = () => opts.onEnd();
  rec.start();
}

export default function SearchCommand({
  onClose,
  history,
  onSubmit,
  onRemove,
}: {
  onClose: () => void;
  history: string[];
  onSubmit: (text: string) => void;
  onRemove: (q: string) => void;
}) {
  const t = useT();
  const [query, setQuery] = useState("");
  const [listening, setListening] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const filtered = history
    .filter((h) => h.toLowerCase().includes(query.trim().toLowerCase()))
    .slice(0, 10);

  function submit(text: string) {
    const v = text.trim();
    if (!v) return;
    onSubmit(v);
    onClose();
  }

  function voice() {
    startVoiceSearch({
      onText: submit,
      onStart: () => setListening(true),
      onEnd: () => setListening(false),
      onUnsupported: () => {
        import("sonner").then(({ toast }) => toast.error(t("search.voiceUnsupported")));
      },
      onError: () => {
        setListening(false);
        import("sonner").then(({ toast }) => toast.error(t("search.voiceError")));
      },
    });
  }

  return createPortal(
    <div className="fixed inset-0 z-[120] flex flex-col bg-yt-base sm:hidden">
      <div className="flex h-14 shrink-0 items-center gap-2 px-2">
        <button
          type="button"
          onClick={onClose}
          aria-label={t("aria.closeSearch")}
          className="grid h-10 w-10 shrink-0 place-items-center rounded-full hover:bg-yt-hover"
        >
          <ArrowLeft width={22} height={22} />
        </button>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            submit(query);
          }}
          className="flex min-w-0 flex-1 items-center rounded-full border border-yt-searchborder bg-yt-base pl-4 pr-1 focus-within:border-yt-cta"
        >
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t("search.placeholder")}
            autoComplete="off"
            className="h-10 w-full bg-transparent text-base outline-none placeholder:text-yt-text2"
          />
          <button
            type="submit"
            aria-label={t("search.button")}
            className="grid h-9 w-9 shrink-0 place-items-center rounded-full hover:bg-yt-hover"
          >
            <SearchIcon width={20} height={20} />
          </button>
        </form>
        <button
          type="button"
          onClick={voice}
          aria-label={t("search.voice")}
          className={`grid h-10 w-10 shrink-0 place-items-center rounded-full ${
            listening ? "bg-red-600 text-white" : "hover:bg-yt-hover"
          }`}
        >
          <MicIcon width={22} height={22} />
        </button>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto py-1">
        {filtered.map((h) => (
          <div
            key={h}
            role="button"
            tabIndex={0}
            onClick={() => submit(h)}
            onKeyDown={(e) => e.key === "Enter" && submit(h)}
            className="group flex cursor-pointer items-center gap-4 px-4 py-2.5 hover:bg-yt-hover"
          >
            <HistoryIcon width={20} height={20} className="shrink-0 text-yt-text2" />
            <span className="min-w-0 flex-1 truncate text-base">{h}</span>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onRemove(h);
              }}
              className="shrink-0 text-xs text-yt-cta"
            >
              {t("search.history.remove")}
            </button>
          </div>
        ))}
      </div>
    </div>,
    document.body,
  );
}
