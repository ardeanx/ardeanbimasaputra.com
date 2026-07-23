"use client";

import { Pencil, Sparkles, Trash2 } from "lucide-react";
import { useCallback, useEffect, useState, useTransition } from "react";
import { createPortal } from "react-dom";
import { toast } from "sonner";
import {
  autoTranslateAction,
  deleteTranslationAction,
  editTranslationAction,
  listTranslationsAction,
  type TranslationInfo,
} from "@/app/(studio)/studio/translation-actions";
import { useFmt, useT } from "@/components/i18n/I18nProvider";
import { askConfirm } from "@/components/ui/dialog";
import { useEditorCtx } from "./context";
import { Section, field } from "./parts";

type EditState = { locale: string; title: string; excerpt: string };

export default function TranslateTab() {
  const t = useT();
  const fmt = useFmt();
  const { meta, locales, defaultLocale } = useEditorCtx();
  const postId = meta.id;
  const targets = locales.filter((l) => l !== defaultLocale);
  const [rows, setRows] = useState<Record<string, TranslationInfo>>({});
  const [busy, setBusy] = useState<string | null>(null);
  const [edit, setEdit] = useState<EditState | null>(null);
  const [, start] = useTransition();

  const reload = useCallback(() => {
    if (!postId) return;
    start(async () => {
      const res = await listTranslationsAction(postId);
      if (Array.isArray(res)) {
        setRows(Object.fromEntries(res.map((r) => [r.locale, r])));
      }
    });
  }, [postId]);

  useEffect(reload, [reload]);

  if (!postId) {
    return <p className="p-4 text-sm text-yt-text2">{t("editor.saveDraftToTranslate")}</p>;
  }

  if (targets.length === 0) {
    return <p className="p-4 text-sm text-yt-text2">{t("editor.addLocaleHint")}</p>;
  }

  const pid = postId;

  function auto(locale: string) {
    setBusy(locale);
    start(async () => {
      const res = await autoTranslateAction(pid, locale);
      setBusy(null);
      if ("error" in res) {
        toast.error(res.error);
      } else {
        toast.success(t("editor.translationCreated", { locale: locale.toUpperCase() }));
        reload();
      }
    });
  }

  async function remove(locale: string) {
    const ok = await askConfirm({
      title: t("editor.deleteTranslationTitle", {
        locale: locale.toUpperCase(),
      }),
      body: t("editor.deleteTranslationBody"),
      confirmLabel: t("common.delete"),
      danger: true,
    });
    if (!ok) return;
    start(async () => {
      const res = await deleteTranslationAction(pid, locale);
      if ("error" in res) {
        toast.error(res.error);
      } else {
        toast.success(t("editor.translationDeleted"));
        reload();
      }
    });
  }

  function openEdit(locale: string) {
    const r = rows[locale];
    setEdit({ locale, title: r?.title ?? "", excerpt: r?.excerpt ?? "" });
  }

  function saveEdit() {
    if (!edit) return;
    const cur = edit;
    if (!cur.title.trim()) {
      toast.error(t("editor.translationTitleRequired"));
      return;
    }
    setEdit(null);
    start(async () => {
      const res = await editTranslationAction(pid, cur.locale, cur.title, cur.excerpt);
      if ("error" in res) {
        toast.error(res.error);
      } else {
        toast.success(t("editor.translationSaved"));
        reload();
      }
    });
  }

  return (
    <>
      <Section title={t("editor.tab.translate")}>
        <p className="mb-3 text-xs text-yt-text2">{t("editor.translationHint")}</p>
        <div className="space-y-2">
          {targets.map((l) => {
            const r = rows[l] as TranslationInfo | undefined;
            return (
              <div key={l} className="rounded-lg border border-yt-outline p-3">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-sm font-semibold uppercase">{l}</span>
                  {r ? (
                    <span
                      className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${
                        r.auto ? "bg-yt-chip text-yt-text2" : "bg-yt-cta/15 text-yt-cta"
                      }`}
                    >
                      {r.auto ? t("editor.auto") : t("editor.manual")} · {fmt.ago(r.updatedAt)}
                    </span>
                  ) : (
                    <span className="rounded-full bg-yt-chip px-2 py-0.5 text-[11px] text-yt-text2">
                      {t("editor.notYet")}
                    </span>
                  )}
                </div>
                {r && <p className="mt-1 line-clamp-1 text-xs text-yt-text2">{r.title}</p>}
                <div className="mt-2 flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => auto(l)}
                    disabled={busy !== null}
                    className="flex h-8 flex-1 items-center justify-center gap-1.5 rounded-full bg-yt-chip text-xs font-medium hover:bg-yt-chip-hover disabled:opacity-50"
                  >
                    <Sparkles size={13} />
                    {busy === l ? t("editor.translating") : t("editor.autoTranslate")}
                  </button>
                  <button
                    type="button"
                    aria-label={t("editor.editTranslationAria", { locale: l })}
                    onClick={() => openEdit(l)}
                    disabled={busy !== null}
                    className="grid h-8 w-8 shrink-0 place-items-center rounded-full hover:bg-yt-hover disabled:opacity-50"
                  >
                    <Pencil size={14} />
                  </button>
                  {r && (
                    <button
                      type="button"
                      aria-label={t("editor.deleteTranslationAria", {
                        locale: l,
                      })}
                      onClick={() => remove(l)}
                      disabled={busy !== null}
                      className="grid h-8 w-8 shrink-0 place-items-center rounded-full text-red-500 hover:bg-yt-hover disabled:opacity-50"
                    >
                      <Trash2 size={14} />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </Section>

      {edit &&
        createPortal(
          <div className="fixed inset-0 z-[120] grid place-items-center p-4">
            <button
              type="button"
              aria-label={t("common.close")}
              onClick={() => setEdit(null)}
              className="absolute inset-0 cursor-default bg-black/60"
            />
            <div className="relative w-full max-w-sm rounded-2xl bg-yt-menu p-5 shadow-[0_8px_48px_rgba(0,0,0,0.4)]">
              <h2 className="text-base font-semibold">
                {t("editor.editTranslation", {
                  locale: edit.locale.toUpperCase(),
                })}
              </h2>
              <label className="mt-3 mb-1 block text-xs text-yt-text2">{t("editor.title_")}</label>
              <input
                value={edit.title}
                onChange={(e) => setEdit((p) => (p ? { ...p, title: e.target.value } : p))}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    saveEdit();
                  }
                  if (e.key === "Escape") setEdit(null);
                }}
                placeholder={t("editor.translationTitlePlaceholder")}
                autoFocus
                className={field}
              />
              <label className="mt-3 mb-1 block text-xs text-yt-text2">{t("editor.summary")}</label>
              <textarea
                value={edit.excerpt}
                onChange={(e) => setEdit((p) => (p ? { ...p, excerpt: e.target.value } : p))}
                rows={3}
                placeholder={t("editor.translationExcerptPlaceholder")}
                className={`${field} resize-none`}
              />
              <div className="mt-5 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setEdit(null)}
                  className="h-9 rounded-full px-4 text-sm font-medium hover:bg-yt-hover"
                >
                  {t("common.cancel")}
                </button>
                <button
                  type="button"
                  onClick={saveEdit}
                  className="h-9 rounded-full bg-yt-cta px-4 text-sm font-medium text-white hover:brightness-110"
                >
                  {t("settings.save")}
                </button>
              </div>
            </div>
          </div>,
          document.body,
        )}
    </>
  );
}
