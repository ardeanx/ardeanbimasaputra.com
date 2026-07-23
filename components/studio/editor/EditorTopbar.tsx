"use client";

import {
  ArrowLeft,
  Code2,
  Eye,
  Info,
  List,
  MoreVertical,
  Plus,
  Redo2,
  Settings2,
  Undo2,
} from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { useT } from "@/components/i18n/I18nProvider";
import { useEditorCtx } from "./context";

const STATUS_KEY: Record<string, string> = {
  DRAFT: "editor.status.draft",
  REVIEW: "editor.status.review",
  PUBLISHED: "editor.status.published",
  REJECTED: "editor.status.rejected",
  ARCHIVED: "editor.status.archived",
};

function Popover({
  children,
  onClose,
  align = "left",
}: {
  children: React.ReactNode;
  onClose: () => void;
  align?: "left" | "right";
}) {
  const t = useT();
  return (
    <>
      <button
        type="button"
        aria-label={t("common.close")}
        className="fixed inset-0 z-[65] cursor-default"
        onClick={onClose}
      />
      <div
        className={`absolute top-11 z-[70] w-64 rounded-xl bg-yt-menu p-2 shadow-[0_4px_32px_rgba(0,0,0,0.3)] ${
          align === "right" ? "right-0" : "left-0"
        }`}
      >
        {children}
      </div>
    </>
  );
}

export default function EditorTopbar() {
  const t = useT();
  const { editor, meta, ui, setUi, isAdmin, pending } = useEditorCtx();
  const [menu, setMenu] = useState<"none" | "info" | "outline" | "options">("none");

  const text = editor?.getText() ?? "";
  const words = text.trim() ? text.trim().split(/\s+/).length : 0;
  const minutes = Math.max(1, Math.ceil(words / 200));

  const headings: { level: number; text: string; pos: number }[] = [];
  if (editor && menu === "outline") {
    editor.state.doc.descendants((node, pos) => {
      if (node.type.name === "heading")
        headings.push({
          level: (node.attrs.level as number) ?? 2,
          text: node.textContent || t("editor.emptyHeading"),
          pos,
        });
    });
  }

  function gotoHeading(pos: number) {
    editor
      ?.chain()
      .focus()
      .setTextSelection(pos + 1)
      .scrollIntoView()
      .run();
    setMenu("none");
  }

  const iconBtn =
    "grid h-9 w-9 place-items-center rounded-full text-yt-text hover:bg-yt-hover disabled:opacity-40";

  return (
    <header className="flex h-14 shrink-0 items-center gap-1 px-3">
      <Link href="/studio/content" aria-label={t("editor.back")} className={iconBtn}>
        <ArrowLeft size={20} />
      </Link>

      <button
        type="button"
        aria-label={t("editor.insertBlock")}
        onClick={() => setUi({ inserter: !ui.inserter })}
        className={`grid h-9 w-9 place-items-center rounded-full text-white ${
          ui.inserter ? "bg-yt-text text-yt-base rotate-45" : "bg-yt-cta"
        } transition-transform`}
      >
        <Plus size={20} />
      </button>

      <button
        type="button"
        aria-label={t("editor.undo")}
        disabled={!editor?.can().undo()}
        onClick={() => editor?.chain().focus().undo().run()}
        className={iconBtn}
      >
        <Undo2 size={19} />
      </button>
      <button
        type="button"
        aria-label={t("editor.redo")}
        disabled={!editor?.can().redo()}
        onClick={() => editor?.chain().focus().redo().run()}
        className={iconBtn}
      >
        <Redo2 size={19} />
      </button>

      <div className="relative">
        <button
          type="button"
          aria-label={t("editor.details")}
          onClick={() => setMenu(menu === "info" ? "none" : "info")}
          className={iconBtn}
        >
          <Info size={19} />
        </button>
        {menu === "info" && (
          <Popover onClose={() => setMenu("none")}>
            <div className="px-2 py-1.5 text-sm">
              <Row label={t("editor.words")} value={String(words)} />
              <Row label={t("editor.characters")} value={String(text.length)} />
              <Row label={t("editor.readTime")} value={t("editor.minutes", { n: minutes })} />
            </div>
          </Popover>
        )}
      </div>

      <div className="relative">
        <button
          type="button"
          aria-label={t("editor.outline")}
          onClick={() => setMenu(menu === "outline" ? "none" : "outline")}
          className={iconBtn}
        >
          <List size={19} />
        </button>
        {menu === "outline" && (
          <Popover onClose={() => setMenu("none")}>
            <div className="max-h-72 overflow-y-auto">
              {headings.length === 0 ? (
                <p className="px-2 py-3 text-sm text-yt-text2">{t("editor.noHeadings")}</p>
              ) : (
                headings.map((h, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => gotoHeading(h.pos)}
                    className={`block w-full truncate rounded-md px-2 py-1.5 text-left text-sm hover:bg-yt-hover ${
                      h.level >= 3 ? "pl-5 text-yt-text2" : "font-medium"
                    }`}
                  >
                    {h.text}
                  </button>
                ))
              )}
            </div>
          </Popover>
        )}
      </div>

      <span className="ml-2 rounded-full bg-yt-chip px-2.5 py-1 text-xs font-medium text-yt-text2">
        {STATUS_KEY[meta.status] ? t(STATUS_KEY[meta.status]) : meta.status}
      </span>

      <div className="ml-auto flex items-center gap-2">
        {pending && <span className="text-sm text-yt-text2">{t("editor.saving")}</span>}
        <button
          type="submit"
          name="intent"
          value="draft"
          disabled={pending}
          className="h-9 rounded-full px-3 text-sm font-medium text-yt-cta hover:bg-yt-hover disabled:opacity-50"
        >
          {t("editor.saveDraft")}
        </button>
        {meta.id && meta.status === "PUBLISHED" && (
          <Link
            href={`/${meta.slug}`}
            target="_blank"
            className="flex h-9 items-center gap-1.5 rounded-full bg-yt-chip px-3.5 text-sm font-medium hover:bg-yt-chip-hover"
          >
            <Eye size={16} /> {t("editor.preview")}
          </Link>
        )}
        <button
          type="submit"
          name="intent"
          value="publish"
          disabled={pending}
          className="h-9 rounded-full bg-yt-cta px-4 text-sm font-medium text-white disabled:opacity-50"
        >
          {isAdmin ? t("editor.publish") : t("editor.submitReview")}
        </button>

        <button
          type="button"
          aria-label={t("editor.settings")}
          onClick={() => setUi({ sidebar: !ui.sidebar })}
          className={`${iconBtn} ${ui.sidebar ? "bg-yt-hover" : ""}`}
        >
          <Settings2 size={19} />
        </button>

        <div className="relative">
          <button
            type="button"
            aria-label={t("editor.options")}
            onClick={() => setMenu(menu === "options" ? "none" : "options")}
            className={iconBtn}
          >
            <MoreVertical size={19} />
          </button>
          {menu === "options" && (
            <Popover align="right" onClose={() => setMenu("none")}>
              <MenuItem
                active={ui.distractionFree}
                onClick={() => {
                  setUi({ distractionFree: !ui.distractionFree });
                  setMenu("none");
                }}
              >
                {t("editor.distractionFree")}
              </MenuItem>
              <MenuItem
                active={ui.codeView}
                icon={<Code2 size={16} />}
                onClick={() => {
                  setUi({ codeView: !ui.codeView });
                  setMenu("none");
                }}
              >
                {t("editor.codeView")}
              </MenuItem>
            </Popover>
          )}
        </div>
      </div>
    </header>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between py-0.5">
      <span className="text-yt-text2">{label}</span>
      <span className="font-medium">{value}</span>
    </div>
  );
}

function MenuItem({
  children,
  onClick,
  active,
  icon,
}: {
  children: React.ReactNode;
  onClick: () => void;
  active?: boolean;
  icon?: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex w-full items-center gap-2 rounded-md px-2.5 py-2 text-left text-sm hover:bg-yt-hover ${
        active ? "text-yt-cta" : ""
      }`}
    >
      {icon}
      {children}
      {active && <span className="ml-auto text-yt-cta">✓</span>}
    </button>
  );
}
