"use client";

import { AlignCenter, AlignLeft, AlignRight, Languages, Upload } from "lucide-react";
import { useRef, useState } from "react";
import { toast } from "sonner";
import { setViewCountAction } from "@/app/(studio)/studio/actions";
import { useT } from "@/components/i18n/I18nProvider";
import Select from "@/components/ui/Select";
import MediaPicker from "../MediaPicker";
import ResourceManager from "../ResourceManager";
import type { PostType, Visibility } from "./context";
import { useEditorCtx } from "./context";
import { btnOptions, calloutOptions, langOptions } from "./nodeviews";
import { Section, field } from "./parts";
import SeoTab from "./SeoTab";
import TranslateTab from "./TranslateTab";

const TYPE_KEY: Record<PostType, string> = {
  VIDEO: "editor.type.video",
  AUDIO: "editor.type.audio",
  POST: "editor.type.post",
  RESOURCE: "editor.type.resource",
};

function MediaUpload({ onDone }: { onDone: (url: string) => void }) {
  const t = useT();
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);

  function upload(file: File) {
    setBusy(true);
    const form = new FormData();
    form.append("file", file);
    fetch("/api/uploads", { method: "POST", body: form })
      .then(async (r) => {
        setBusy(false);
        const data = (await r.json().catch(() => ({}))) as {
          url?: string;
          error?: string;
        };
        if (!r.ok || !data.url) {
          toast.error(data.error ?? t("editor.mediaUploadFailed"));
          return;
        }
        onDone(data.url);
        toast.success(t("editor.mediaUploaded"));
      })
      .catch(() => {
        setBusy(false);
        toast.error(t("editor.mediaUploadFailed"));
      });
  }

  return (
    <>
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        disabled={busy}
        className="flex h-9 w-full items-center justify-center gap-2 rounded-full bg-yt-chip text-sm font-medium hover:bg-yt-chip-hover disabled:opacity-50"
      >
        <Upload size={15} /> {busy ? t("editor.uploading") : t("editor.uploadMediaFile")}
      </button>
      <input
        ref={inputRef}
        type="file"
        accept="video/mp4,video/webm,audio/mpeg"
        hidden
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) upload(f);
          e.target.value = "";
        }}
      />
    </>
  );
}

function ViewCountSection({ postId }: { postId: string }) {
  const t = useT();
  const { meta, setMeta } = useEditorCtx();
  const [busy, setBusy] = useState(false);

  function apply() {
    const value = Math.max(0, Math.trunc(Number(meta.viewCount) || 0));
    setBusy(true);
    setViewCountAction(postId, value)
      .then((res) => {
        setBusy(false);
        if ("error" in res) {
          toast.error(res.error);
          return;
        }
        setMeta({ viewCount: String(value) });
        toast.success(t("editor.viewCountSaved"));
      })
      .catch(() => {
        setBusy(false);
        toast.error(t("editor.viewCountFailed"));
      });
  }

  return (
    <Section title={t("editor.sec.viewCount")}>
      <div className="flex gap-2">
        <input
          value={meta.viewCount}
          onChange={(e) => setMeta({ viewCount: e.target.value.replace(/[^0-9]/g, "") })}
          inputMode="numeric"
          aria-label={t("editor.sec.viewCount")}
          className={field}
        />
        <button
          type="button"
          onClick={apply}
          disabled={busy}
          className="h-9 shrink-0 rounded-full bg-yt-cta px-4 text-sm font-medium text-white hover:opacity-90 disabled:opacity-50"
        >
          {t("editor.applyViews")}
        </button>
      </div>
    </Section>
  );
}

function PostTab() {
  const t = useT();
  const { meta, setMeta, categories, isAdmin } = useEditorCtx();
  return (
    <div className="divide-y divide-yt-outline/50">
      <Section title={t("editor.sec.summaryVisibility")}>
        <label className="mb-1 block text-xs text-yt-text2">{t("editor.visibility")}</label>
        <Select
          ariaLabel={t("editor.visibility")}
          value={meta.visibility}
          onChange={(v) => setMeta({ visibility: v as Visibility })}
          options={[
            { value: "PUBLIC", label: t("editor.vis.public") },
            { value: "UNLISTED", label: t("editor.vis.unlisted") },
            { value: "PRIVATE", label: t("editor.vis.private") },
          ]}
          className="mb-3"
        />
        <label className="mb-1 block text-xs text-yt-text2">{t("editor.excerpt")}</label>
        <textarea
          value={meta.excerpt}
          onChange={(e) => setMeta({ excerpt: e.target.value })}
          rows={3}
          placeholder={t("editor.excerptPlaceholder")}
          className={`${field} resize-none`}
        />
      </Section>

      <Section title={t("editor.sec.permalink")}>
        <div className="flex items-center gap-1 rounded-lg border border-yt-outline px-3">
          <span className="text-sm text-yt-text2">/</span>
          <input
            value={meta.slug}
            onChange={(e) =>
              setMeta({
                slug: e.target.value
                  .toLowerCase()
                  .replace(/[^a-z0-9-]/g, "-")
                  .replace(/-+/g, "-"),
              })
            }
            placeholder={t("editor.permalinkPlaceholder")}
            className="h-9 w-full bg-transparent text-sm outline-none"
          />
        </div>
      </Section>

      <Section title={t("editor.sec.contentType")}>
        <Select
          ariaLabel={t("editor.sec.contentType")}
          value={meta.type}
          onChange={(v) => setMeta({ type: v as PostType })}
          options={(Object.keys(TYPE_KEY) as PostType[]).map((k) => ({
            value: k,
            label: t(TYPE_KEY[k]),
          }))}
        />
      </Section>

      {(meta.type === "VIDEO" || meta.type === "AUDIO") && (
        <Section
          title={meta.type === "VIDEO" ? t("editor.sec.videoSource") : t("editor.sec.audioSource")}
        >
          <input
            value={meta.mediaUrl}
            onChange={(e) => setMeta({ mediaUrl: e.target.value })}
            placeholder={t("editor.mediaUrlPlaceholder")}
            className={`${field} mb-2`}
          />
          <div className="mb-2">
            <MediaUpload onDone={(url) => setMeta({ mediaUrl: url })} />
          </div>
          <input
            value={meta.durationSec}
            onChange={(e) => setMeta({ durationSec: e.target.value.replace(/[^0-9]/g, "") })}
            inputMode="numeric"
            placeholder={t("editor.durationPlaceholder")}
            className={field}
          />
        </Section>
      )}

      {meta.type === "RESOURCE" && (
        <Section title={t("editor.sec.resource")}>
          <input
            value={meta.repoUrl}
            onChange={(e) => setMeta({ repoUrl: e.target.value })}
            placeholder={t("editor.repoUrlPlaceholder")}
            className={`${field} mb-3`}
          />
          {meta.id ? (
            <ResourceManager postId={meta.id} />
          ) : (
            <p className="text-xs text-yt-text2">{t("editor.saveDraftToUpload")}</p>
          )}
        </Section>
      )}

      <Section title={t("editor.sec.category")}>
        <Select
          ariaLabel={t("editor.sec.category")}
          value={meta.categoryId != null ? String(meta.categoryId) : ""}
          onChange={(v) => setMeta({ categoryId: v ? Number(v) : null })}
          options={[
            { value: "", label: t("studio.common.noCategory") },
            ...categories.map((c) => ({ value: String(c.id), label: c.name })),
          ]}
        />
      </Section>

      <Section title={t("editor.sec.cover")}>
        <MediaPicker value={meta.thumbnail} onChange={(url) => setMeta({ thumbnail: url })} />
      </Section>

      {isAdmin && meta.id && <ViewCountSection postId={meta.id} />}
    </div>
  );
}

function AlignRow() {
  const { editor } = useEditorCtx();
  if (!editor) return null;
  const b = (active: boolean) =>
    `grid h-9 flex-1 place-items-center rounded-lg border border-yt-outline hover:bg-yt-hover ${
      active ? "bg-yt-hover text-yt-cta" : ""
    }`;
  return (
    <div className="flex gap-1">
      <button
        type="button"
        className={b(editor.isActive({ textAlign: "left" }))}
        onClick={() => editor.chain().focus().setTextAlign("left").run()}
      >
        <AlignLeft size={16} />
      </button>
      <button
        type="button"
        className={b(editor.isActive({ textAlign: "center" }))}
        onClick={() => editor.chain().focus().setTextAlign("center").run()}
      >
        <AlignCenter size={16} />
      </button>
      <button
        type="button"
        className={b(editor.isActive({ textAlign: "right" }))}
        onClick={() => editor.chain().focus().setTextAlign("right").run()}
      >
        <AlignRight size={16} />
      </button>
    </div>
  );
}

const BLOCK_KNOWN = [
  "heading",
  "paragraph",
  "codeBlock",
  "image",
  "table",
  "callout",
  "button",
  "card",
  "accordionItem",
  "tab",
  "math",
  "mermaid",
  "blockquote",
  "bulletList",
  "orderedList",
];

function BlockTab() {
  const t = useT();
  const { editor } = useEditorCtx();
  const imgWidths = [
    { value: "", label: t("editor.width.auto") },
    { value: "320", label: t("editor.width.small") },
    { value: "480", label: t("editor.width.medium") },
    { value: "640", label: t("editor.width.large") },
    { value: "100%", label: t("editor.width.full") },
  ];
  if (!editor) return <p className="p-4 text-sm text-yt-text2">{t("editor.notReady")}</p>;

  const a = (n: string) => editor.isActive(n);
  const at = (n: string) => editor.getAttributes(n);
  const set = (n: string, patch: Record<string, unknown>) =>
    editor.chain().focus().updateAttributes(n, patch).run();

  const anyActive = BLOCK_KNOWN.some((n) => editor.isActive(n));

  const lvlBtn = (n: number) =>
    `h-9 flex-1 rounded-lg border border-yt-outline text-sm font-semibold hover:bg-yt-hover ${
      editor.isActive("heading", { level: n }) ? "bg-yt-hover text-yt-cta" : ""
    }`;
  const toggleBtn = (active: boolean) =>
    `h-9 flex-1 rounded-lg border border-yt-outline text-sm font-medium hover:bg-yt-hover ${
      active ? "bg-yt-hover text-yt-cta" : ""
    }`;

  const callout = at("callout");
  const button = at("button");
  const card = at("card");
  const code = at("codeBlock");
  const img = at("image");
  const math = at("math");
  const mermaid = at("mermaid");
  const accItem = at("accordionItem");
  const tabAttr = at("tab");
  const imgAlign = (img.align as string) ?? "";

  return (
    <div className="divide-y divide-yt-outline/50">
      {a("heading") && (
        <Section title={t("editor.sec.headingLevel")}>
          <div className="flex gap-1">
            {[2, 3, 4].map((n) => (
              <button
                key={n}
                type="button"
                className={lvlBtn(n)}
                onClick={() =>
                  editor
                    .chain()
                    .focus()
                    .toggleHeading({ level: n as 2 })
                    .run()
                }
              >
                H{n}
              </button>
            ))}
          </div>
        </Section>
      )}

      {(a("heading") || a("paragraph") || a("blockquote")) && (
        <Section title={t("editor.align")}>
          <AlignRow />
        </Section>
      )}

      {a("callout") && (
        <Section title={t("editor.sec.callout")}>
          <label className="mb-1 block text-xs text-yt-text2">{t("editor.type_")}</label>
          <Select
            ariaLabel={t("editor.calloutType")}
            value={(callout.variant as string) ?? "info"}
            onChange={(v) => set("callout", { variant: v })}
            options={calloutOptions(t)}
            className="mb-3"
          />
          <input
            value={(callout.title as string) ?? ""}
            onChange={(e) => set("callout", { title: e.target.value })}
            placeholder={t("editor.titleOptional")}
            className={field}
          />
        </Section>
      )}

      {a("button") && (
        <Section title={t("editor.sec.button")}>
          <input
            value={(button.label as string) ?? ""}
            onChange={(e) => set("button", { label: e.target.value })}
            placeholder={t("editor.buttonText")}
            className={`${field} mb-2`}
          />
          <input
            value={(button.href as string) ?? ""}
            onChange={(e) => set("button", { href: e.target.value })}
            placeholder="https://…"
            className={`${field} mb-2`}
          />
          <Select
            ariaLabel={t("editor.buttonStyle")}
            value={(button.variant as string) ?? "primary"}
            onChange={(v) => set("button", { variant: v })}
            options={btnOptions(t)}
          />
        </Section>
      )}

      {a("card") && (
        <Section title={t("editor.sec.card")}>
          <input
            value={(card.title as string) ?? ""}
            onChange={(e) => set("card", { title: e.target.value })}
            placeholder={t("editor.title_")}
            className={`${field} mb-2`}
          />
          <input
            value={(card.description as string) ?? ""}
            onChange={(e) => set("card", { description: e.target.value })}
            placeholder={t("editor.description")}
            className={`${field} mb-2`}
          />
          <input
            value={(card.href as string) ?? ""}
            onChange={(e) => set("card", { href: e.target.value })}
            placeholder={t("editor.linkOptional")}
            className={`${field} mb-2`}
          />
          <input
            value={(card.icon as string) ?? ""}
            onChange={(e) => set("card", { icon: e.target.value })}
            placeholder={t("editor.iconEmoji")}
            className={field}
          />
        </Section>
      )}

      {a("codeBlock") && (
        <Section title={t("editor.sec.codeBlock")}>
          <label className="mb-1 block text-xs text-yt-text2">{t("editor.language")}</label>
          <Select
            ariaLabel={t("editor.codeLanguage")}
            value={(code.language as string) ?? ""}
            onChange={(v) => set("codeBlock", { language: v })}
            options={langOptions(t)}
            className="mb-3"
          />
          <input
            value={(code.filename as string) ?? ""}
            onChange={(e) => set("codeBlock", { filename: e.target.value })}
            placeholder={t("editor.filenamePlaceholder")}
            className={field}
          />
        </Section>
      )}

      {a("image") && (
        <Section title={t("editor.sec.image")}>
          <label className="mb-1 block text-xs text-yt-text2">{t("editor.altText")}</label>
          <input
            value={(img.alt as string) ?? ""}
            onChange={(e) => set("image", { alt: e.target.value })}
            placeholder={t("editor.altPlaceholder")}
            className={`${field} mb-3`}
          />
          <label className="mb-1 block text-xs text-yt-text2">{t("editor.width")}</label>
          <Select
            ariaLabel={t("editor.imageWidth")}
            value={(img.width as string) ?? ""}
            onChange={(v) => set("image", { width: v || null })}
            options={imgWidths}
            className="mb-3"
          />
          <label className="mb-1 block text-xs text-yt-text2">{t("editor.align")}</label>
          <div className="flex gap-1">
            {(
              [
                ["left", AlignLeft],
                ["center", AlignCenter],
                ["right", AlignRight],
              ] as const
            ).map(([val, Icon]) => (
              <button
                key={val}
                type="button"
                className={`grid h-9 flex-1 place-items-center rounded-lg border border-yt-outline hover:bg-yt-hover ${
                  imgAlign === val || (val === "left" && !imgAlign) ? "bg-yt-hover text-yt-cta" : ""
                }`}
                onClick={() => set("image", { align: val })}
              >
                <Icon size={16} />
              </button>
            ))}
          </div>
        </Section>
      )}

      {a("math") && (
        <Section title={t("editor.sec.formula")}>
          <textarea
            value={(math.latex as string) ?? ""}
            onChange={(e) => set("math", { latex: e.target.value })}
            rows={3}
            placeholder="e = mc^2"
            className={`${field} resize-none font-mono`}
          />
        </Section>
      )}

      {a("mermaid") && (
        <Section title={t("editor.sec.mermaid")}>
          <textarea
            value={(mermaid.code as string) ?? ""}
            onChange={(e) => set("mermaid", { code: e.target.value })}
            rows={4}
            placeholder="graph TD; A-->B;"
            className={`${field} resize-none font-mono`}
          />
        </Section>
      )}

      {a("accordionItem") && (
        <Section title={t("editor.sec.accordionItem")}>
          <input
            value={(accItem.title as string) ?? ""}
            onChange={(e) => set("accordionItem", { title: e.target.value })}
            placeholder={t("editor.itemTitle")}
            className={field}
          />
        </Section>
      )}

      {a("tab") && (
        <Section title={t("editor.sec.tab")}>
          <input
            value={(tabAttr.label as string) ?? ""}
            onChange={(e) => set("tab", { label: e.target.value })}
            placeholder={t("editor.tabLabel")}
            className={field}
          />
        </Section>
      )}

      {(a("bulletList") || a("orderedList")) && (
        <Section title={t("editor.sec.list")}>
          <div className="flex gap-1">
            <button
              type="button"
              className={toggleBtn(a("bulletList"))}
              onClick={() => editor.chain().focus().toggleBulletList().run()}
            >
              {t("editor.bullet")}
            </button>
            <button
              type="button"
              className={toggleBtn(a("orderedList"))}
              onClick={() => editor.chain().focus().toggleOrderedList().run()}
            >
              {t("editor.numbered")}
            </button>
          </div>
        </Section>
      )}

      {a("table") && (
        <Section title={t("editor.sec.table")}>
          <div className="grid grid-cols-2 gap-1.5 text-sm">
            <TableBtn onClick={() => editor.chain().focus().addRowAfter().run()}>
              {t("editor.table.addRow")}
            </TableBtn>
            <TableBtn onClick={() => editor.chain().focus().addColumnAfter().run()}>
              {t("editor.table.addCol")}
            </TableBtn>
            <TableBtn onClick={() => editor.chain().focus().deleteRow().run()}>
              {t("editor.table.delRow")}
            </TableBtn>
            <TableBtn onClick={() => editor.chain().focus().deleteColumn().run()}>
              {t("editor.table.delCol")}
            </TableBtn>
            <TableBtn onClick={() => editor.chain().focus().toggleHeaderRow().run()}>
              {t("editor.table.header")}
            </TableBtn>
            <TableBtn danger onClick={() => editor.chain().focus().deleteTable().run()}>
              {t("editor.table.delete")}
            </TableBtn>
          </div>
        </Section>
      )}

      {!anyActive && <p className="p-4 text-sm text-yt-text2">{t("editor.selectBlock")}</p>}
    </div>
  );
}

function TableBtn({
  children,
  onClick,
  danger,
}: {
  children: React.ReactNode;
  onClick: () => void;
  danger?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`h-9 rounded-lg border border-yt-outline hover:bg-yt-hover ${
        danger ? "text-red-500" : ""
      }`}
    >
      {children}
    </button>
  );
}

export default function SettingsSidebar() {
  const t = useT();
  const { ui, setUi } = useEditorCtx();
  const tabBtn = (active: boolean) =>
    `h-9 flex-1 rounded-lg text-sm font-medium ${active ? "bg-yt-hover" : "hover:bg-yt-hover"}`;
  return (
    <aside className="flex w-80 shrink-0 flex-col bg-yt-raised">
      <div className="flex shrink-0 items-center gap-1 p-2">
        <button
          type="button"
          onClick={() => setUi({ tab: "post" })}
          className={tabBtn(ui.tab === "post")}
        >
          {t("editor.tab.post")}
        </button>
        <button
          type="button"
          onClick={() => setUi({ tab: "block" })}
          className={tabBtn(ui.tab === "block")}
        >
          {t("editor.tab.block")}
        </button>
        <button
          type="button"
          onClick={() => setUi({ tab: "seo" })}
          className={tabBtn(ui.tab === "seo")}
        >
          {t("editor.tab.seo")}
        </button>
        <button
          type="button"
          aria-label={t("editor.tab.translate")}
          title={t("editor.tab.translate")}
          onClick={() => setUi({ tab: "translate" })}
          className={`grid h-9 w-11 shrink-0 place-items-center rounded-lg ${
            ui.tab === "translate" ? "bg-yt-hover text-yt-cta" : "hover:bg-yt-hover"
          }`}
        >
          <Languages size={16} />
        </button>
      </div>
      <div className="flex-1 overflow-y-auto">
        {ui.tab === "post" && <PostTab />}
        {ui.tab === "block" && <BlockTab />}
        {ui.tab === "seo" && <SeoTab />}
        {ui.tab === "translate" && <TranslateTab />}
      </div>
    </aside>
  );
}
