"use client";

import type { Editor } from "@tiptap/react";
import { X } from "lucide-react";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { useT } from "@/components/i18n/I18nProvider";
import MediaPicker from "../MediaPicker";
import { field } from "./parts";

let openFn: ((editor: Editor) => void) | null = null;

export function openImageDialog(editor: Editor): void {
  openFn?.(editor);
}

export default function ImageDialogHost() {
  const t = useT();
  const [editor, setEditor] = useState<Editor | null>(null);
  const [mode, setMode] = useState<"upload" | "url">("upload");
  const [url, setUrl] = useState("");
  const [alt, setAlt] = useState("");

  useEffect(() => {
    openFn = (e) => {
      setMode("upload");
      setUrl("");
      setAlt("");
      setEditor(e);
    };
    return () => {
      openFn = null;
    };
  }, []);

  useEffect(() => {
    if (!editor) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setEditor(null);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [editor]);

  if (!editor) return null;

  function insert(src: string) {
    const clean = src.trim();
    if (!clean || !editor) return;
    editor
      .chain()
      .focus()
      .setImage({ src: clean, alt: alt.trim() || undefined })
      .run();
    setEditor(null);
  }

  const tab = (active: boolean) =>
    `h-9 flex-1 rounded-lg text-sm font-medium ${active ? "bg-yt-hover" : "hover:bg-yt-hover"}`;

  return createPortal(
    <div className="fixed inset-0 z-[110] grid place-items-center p-4">
      <button
        type="button"
        aria-label={t("common.close")}
        onClick={() => setEditor(null)}
        className="absolute inset-0 cursor-default bg-black/60"
      />
      <div className="relative w-full max-w-md rounded-2xl bg-yt-menu p-5 shadow-[0_8px_48px_rgba(0,0,0,0.4)]">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-base font-semibold">{t("editor.insertImage")}</h2>
          <button
            type="button"
            aria-label={t("common.close")}
            onClick={() => setEditor(null)}
            className="grid h-8 w-8 place-items-center rounded-full hover:bg-yt-hover"
          >
            <X size={16} />
          </button>
        </div>
        <div className="mb-4 flex gap-1">
          <button
            type="button"
            onClick={() => setMode("upload")}
            className={tab(mode === "upload")}
          >
            {t("editor.upload")}
          </button>
          <button type="button" onClick={() => setMode("url")} className={tab(mode === "url")}>
            {t("editor.fromUrl")}
          </button>
        </div>
        <label className="mb-1 block text-xs text-yt-text2">{t("editor.altTextLabel")}</label>
        <input
          value={alt}
          onChange={(e) => setAlt(e.target.value)}
          placeholder={t("editor.altDialogPlaceholder")}
          className={`${field} mb-4`}
        />
        {mode === "upload" ? (
          <MediaPicker value={null} onChange={insert} />
        ) : (
          <>
            <input
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  insert(url);
                }
              }}
              placeholder="https://…"
              autoFocus
              className={field}
            />
            <div className="mt-4 flex justify-end">
              <button
                type="button"
                onClick={() => insert(url)}
                disabled={!url.trim()}
                className="h-9 rounded-full bg-yt-cta px-4 text-sm font-medium text-white hover:brightness-110 disabled:opacity-50"
              >
                {t("editor.insert")}
              </button>
            </div>
          </>
        )}
      </div>
    </div>,
    document.body,
  );
}
