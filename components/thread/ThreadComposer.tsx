"use client";

import {
  BarChart3,
  Ghost,
  ImagePlus,
  MapPin,
  Music2,
  PenLine,
  Plus,
  Smile,
  Sparkles,
  X,
} from "lucide-react";
import { HexColorPicker } from "react-colorful";
import { useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Turnstile, turnstileToken } from "@/app/(auth)/Turnstile";
import { createThreadPostAction } from "@/app/(shell)/threads/actions";
import { fetchOgCardAction } from "@/app/(shell)/og-actions";
import { useT } from "@/components/i18n/I18nProvider";
import EmojiPicker from "@/components/thread/EmojiPicker";
import GifPicker from "@/components/thread/GifPicker";
import PollComposer from "@/components/thread/PollComposer";
import OgCard, { type OgCardData } from "@/components/og/OgCard";
import RichEditor, { extractFirstUrl } from "@/components/rte/RichEditor";
import Select from "@/components/ui/Select";

type Poll = { options: string[]; endsAt: string | null };
type Panel = "" | "emoji" | "gif" | "color";

function appendEmoji(value: string, emoji: string): string {
  try {
    const doc = JSON.parse(value) as {
      type?: string;
      content?: { type?: string; content?: unknown[] }[];
    };
    if (doc?.type === "doc" && Array.isArray(doc.content)) {
      const last = doc.content[doc.content.length - 1];
      if (last?.type === "paragraph") {
        last.content = [...(last.content ?? []), { type: "text", text: emoji }];
      } else {
        doc.content.push({
          type: "paragraph",
          content: [{ type: "text", text: emoji }],
        });
      }
      return JSON.stringify(doc);
    }
  } catch {
    return JSON.stringify({
      type: "doc",
      content: [{ type: "paragraph", content: [{ type: "text", text: emoji }] }],
    });
  }
  return JSON.stringify({
    type: "doc",
    content: [{ type: "paragraph", content: [{ type: "text", text: emoji }] }],
  });
}

export default function ThreadComposer({
  topics,
  defaultTopicSlug,
  isLoggedIn,
  siteKey,
  variant = "button",
  avatarUrl,
  userName,
}: {
  topics: { slug: string; name: string }[];
  defaultTopicSlug?: string;
  isLoggedIn: boolean;
  siteKey: string | null;
  variant?: "button" | "bar";
  avatarUrl?: string | null;
  userName?: string | null;
}) {
  const t = useT();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [topicSlug, setTopicSlug] = useState(defaultTopicSlug ?? topics[0]?.slug ?? "");
  const [body, setBody] = useState("");
  const [rteKey, setRteKey] = useState(0);
  const [mediaUrls, setMediaUrls] = useState<string[]>([]);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [color, setColor] = useState<string | null>(null);
  const [location, setLocation] = useState("");
  const [showLocation, setShowLocation] = useState(false);
  const [poll, setPoll] = useState<Poll | null>(null);
  const [ghost, setGhost] = useState(false);
  const [showOptions, setShowOptions] = useState(false);
  const [addToThread, setAddToThread] = useState("");
  const [showAdd, setShowAdd] = useState(false);
  const [og, setOg] = useState<OgCardData | null>(null);
  const [ogUrl, setOgUrl] = useState<string | null>(null);
  const [ogDismissed, setOgDismissed] = useState<string | null>(null);
  const [anonName, setAnonName] = useState("");
  const [panel, setPanel] = useState<Panel>("");
  const [uploading, setUploading] = useState(false);
  const [audioUploading, setAudioUploading] = useState(false);
  const [pending, start] = useTransition();
  const dialogRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const url = extractFirstUrl(body);
    if (!url || url === ogUrl || url === ogDismissed) return;
    let active = true;
    const id = setTimeout(async () => {
      const data = await fetchOgCardAction(url);
      if (!active) return;
      setOgUrl(url);
      setOg(data);
    }, 600);
    return () => {
      active = false;
      clearTimeout(id);
    };
  }, [body, open, ogUrl, ogDismissed]);

  function reset() {
    setBody("");
    setRteKey((k) => k + 1);
    setMediaUrls([]);
    setAudioUrl(null);
    setColor(null);
    setLocation("");
    setShowLocation(false);
    setPoll(null);
    setGhost(false);
    setAddToThread("");
    setShowAdd(false);
    setOg(null);
    setOgUrl(null);
    setOgDismissed(null);
    setPanel("");
    setShowOptions(false);
  }

  function close() {
    setOpen(false);
    reset();
  }

  async function upload(file: File, kind: "image" | "audio") {
    const setBusy = kind === "audio" ? setAudioUploading : setUploading;
    setBusy(true);
    try {
      const form = new FormData();
      form.append("file", file);
      const res = await fetch("/api/uploads", { method: "POST", body: form });
      const data = (await res.json()) as { url?: string; error?: string };
      if (!res.ok || !data.url) throw new Error(data.error);
      if (kind === "audio") setAudioUrl(data.url);
      else setMediaUrls((m) => [...m, data.url as string]);
    } catch {
      toast.error(t("thread.compose.uploadFailed"));
    } finally {
      setBusy(false);
    }
  }

  const hasContent =
    Boolean(extractFirstUrl(body)) ||
    body.replace(/[^\p{L}\p{N}]/gu, "").length > 0 ||
    mediaUrls.length > 0 ||
    Boolean(poll && poll.options.filter(Boolean).length >= 2);

  function submit() {
    if (!hasContent || pending) return;
    start(async () => {
      const res = await createThreadPostAction({
        topicSlug,
        body,
        mediaUrls,
        audioUrl,
        color,
        location: showLocation ? location : null,
        ghost,
        poll,
        ogCard: og,
        addToThread: showAdd ? addToThread : undefined,
        anonName: isLoggedIn ? undefined : anonName,
        turnstileToken: !isLoggedIn && siteKey ? turnstileToken() : undefined,
      });
      if ("error" in res) {
        toast.error(t(res.error));
        return;
      }
      close();
      router.push(`/threads/p/${res.id}`);
    });
  }

  const identity = isLoggedIn ? userName || t("thread.compose.you") : t("thread.anon");

  const roundBtn =
    "grid h-9 w-9 place-items-center rounded-full text-yt-cta transition-colors hover:bg-yt-cta/10";

  return (
    <>
      {variant === "bar" ? (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="flex w-full items-center gap-3 rounded-2xl border border-yt-outline bg-yt-raised p-2.5 text-left transition-colors hover:border-yt-searchborder"
        >
          {avatarUrl ? (
            <img
              src={avatarUrl}
              alt=""
              className="h-9 w-9 shrink-0 rounded-full bg-yt-hover object-cover"
            />
          ) : (
            <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-yt-chip text-yt-text2">
              <PenLine size={16} />
            </span>
          )}
          <span className="flex-1 truncate rounded-full bg-yt-base px-4 py-2.5 text-sm text-yt-text2">
            {t("thread.compose.trigger")}
          </span>
          <span className="hidden shrink-0 place-items-center rounded-full bg-yt-chip px-3 py-2.5 text-yt-text2 sm:grid">
            <ImagePlus size={18} />
          </span>
        </button>
      ) : (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="inline-flex h-9 shrink-0 items-center gap-1.5 rounded-full bg-yt-cta px-4 text-sm font-semibold text-yt-cta-text transition-opacity hover:opacity-90"
        >
          <PenLine size={16} />
          {t("thread.compose.trigger")}
        </button>
      )}

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/60 p-4 backdrop-blur-sm sm:items-center"
          onClick={close}
        >
          <div
            ref={dialogRef}
            onClick={(e) => e.stopPropagation()}
            className="my-auto flex w-full max-w-xl flex-col overflow-hidden rounded-2xl border border-yt-outline bg-yt-raised shadow-[0_16px_64px_rgba(0,0,0,0.5)]"
            style={
              color
                ? { background: `color-mix(in srgb, ${color} 12%, var(--yt-raised))` }
                : undefined
            }
          >
            <header className="flex items-center justify-between border-b border-yt-outline px-4 py-3">
              <button
                type="button"
                onClick={close}
                className="text-sm font-medium text-yt-text2 transition-colors hover:text-yt-text"
              >
                {t("common.cancel")}
              </button>
              <h2 className="text-sm font-semibold">{t("thread.compose.newThread")}</h2>
              <button
                type="button"
                onClick={() => setPanel((p) => (p === "color" ? "" : "color"))}
                aria-label={t("thread.compose.color")}
                title={t("thread.compose.color")}
                className={`grid h-8 w-8 place-items-center rounded-full transition-colors hover:bg-yt-hover hover:text-yt-text ${
                  panel === "color" ? "bg-yt-hover" : "text-yt-text2"
                }`}
                style={color ? { color } : undefined}
              >
                <Sparkles size={18} />
              </button>
            </header>

            <div className="flex-1 overflow-y-auto px-4 py-3">
              <div className="flex gap-3">
                {avatarUrl && !ghost ? (
                  <img
                    src={avatarUrl}
                    alt=""
                    className="h-10 w-10 shrink-0 rounded-full bg-yt-hover object-cover"
                  />
                ) : (
                  <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-yt-chip text-yt-text2">
                    {ghost ? <Ghost size={18} /> : <PenLine size={16} />}
                  </span>
                )}

                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold">
                      {ghost ? t("thread.anon") : identity}
                    </span>
                  </div>

                  <div className="mt-0.5">
                    <Select
                      value={topicSlug}
                      onChange={setTopicSlug}
                      ariaLabel={t("thread.compose.topic")}
                      options={topics.map((tp) => ({
                        value: tp.slug,
                        label: `> ${tp.name}`,
                      }))}
                      buttonClassName="flex h-7 items-center gap-1 rounded-full px-0 text-sm font-medium text-yt-cta hover:opacity-80"
                    />
                  </div>

                  <div className="mt-2">
                    <RichEditor
                      key={rteKey}
                      value={body}
                      onChange={setBody}
                      placeholder={t("thread.compose.whatsNew")}
                      minRows={4}
                    />
                  </div>

                  {mediaUrls.length > 0 && (
                    <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-3">
                      {mediaUrls.map((url) => (
                        <div key={url} className="relative">
                          <img
                            src={url}
                            alt=""
                            className="h-24 w-full rounded-xl border border-yt-outline object-cover"
                          />
                          <button
                            type="button"
                            aria-label={t("thread.compose.removeImage")}
                            onClick={() => setMediaUrls((m) => m.filter((u) => u !== url))}
                            className="absolute right-1 top-1 grid h-6 w-6 place-items-center rounded-full bg-black/70 text-white transition-colors hover:bg-black"
                          >
                            <X size={13} />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  {audioUrl && (
                    <div className="mt-2 flex items-center gap-2 rounded-xl border border-yt-outline bg-yt-base p-2">
                      <audio src={audioUrl} controls className="h-9 min-w-0 flex-1" />
                      <button
                        type="button"
                        aria-label={t("thread.compose.removeAudio")}
                        onClick={() => setAudioUrl(null)}
                        className="grid h-7 w-7 shrink-0 place-items-center rounded-full text-yt-text2 hover:bg-yt-hover hover:text-yt-text"
                      >
                        <X size={14} />
                      </button>
                    </div>
                  )}

                  {poll && (
                    <div className="mt-2">
                      <PollComposer value={poll} onChange={setPoll} />
                    </div>
                  )}

                  {showLocation && (
                    <div className="mt-2 flex items-center gap-2 rounded-full border border-yt-outline bg-yt-base px-3">
                      <MapPin size={16} className="shrink-0 text-yt-text2" />
                      <input
                        value={location}
                        onChange={(e) => setLocation(e.target.value)}
                        placeholder={t("thread.compose.locationPlaceholder")}
                        maxLength={80}
                        className="h-9 w-full bg-transparent text-sm outline-none placeholder:text-yt-text2"
                      />
                    </div>
                  )}

                  {og && (
                    <div className="relative mt-2">
                      <OgCard data={og} />
                      <button
                        type="button"
                        aria-label={t("common.close")}
                        onClick={() => {
                          setOgDismissed(ogUrl);
                          setOg(null);
                        }}
                        className="absolute right-2 top-2 grid h-6 w-6 place-items-center rounded-full bg-black/70 text-white transition-colors hover:bg-black"
                      >
                        <X size={13} />
                      </button>
                    </div>
                  )}

                  {showAdd && (
                    <textarea
                      rows={2}
                      value={addToThread}
                      onChange={(e) => setAddToThread(e.target.value)}
                      placeholder={t("thread.compose.addPlaceholder")}
                      className="mt-2 w-full resize-none rounded-xl border border-yt-outline bg-yt-base p-2.5 text-sm outline-none transition-colors focus:border-yt-searchborder placeholder:text-yt-text2"
                    />
                  )}

                  <button
                    type="button"
                    onClick={() => setShowAdd((v) => !v)}
                    className="mt-2 inline-flex items-center gap-1.5 text-sm text-yt-text2 transition-colors hover:text-yt-text"
                  >
                    <Plus size={15} />
                    {t("thread.compose.addToThread")}
                  </button>

                  {panel === "emoji" && (
                    <div className="mt-2">
                      <EmojiPicker
                        onSelect={(e) => {
                          setBody((b) => appendEmoji(b, e));
                          setRteKey((k) => k + 1);
                          setPanel("");
                        }}
                      />
                    </div>
                  )}
                  {panel === "gif" && (
                    <div className="mt-2">
                      <GifPicker
                        onSelect={(url) => {
                          setMediaUrls((m) => [...m, url]);
                          setPanel("");
                        }}
                      />
                    </div>
                  )}
                  {panel === "color" && (
                    <div className="mt-2 flex flex-col items-start gap-2 rounded-2xl border border-yt-outline bg-yt-menu p-3">
                      <HexColorPicker color={color ?? "#065fd4"} onChange={setColor} />
                      <button
                        type="button"
                        onClick={() => {
                          setColor(null);
                          setPanel("");
                        }}
                        className="rounded-full bg-yt-chip px-3 py-1 text-xs font-medium hover:bg-yt-chip-hover"
                      >
                        {t("thread.compose.clearColor")}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-1 border-t border-yt-outline px-4 py-2">
              <label className={`${roundBtn} cursor-pointer`} title={t("thread.compose.addImage")}>
                {uploading ? (
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-yt-cta border-t-transparent" />
                ) : (
                  <ImagePlus size={18} />
                )}
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  disabled={uploading}
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) void upload(f, "image");
                    e.target.value = "";
                  }}
                />
              </label>
              <button
                type="button"
                onClick={() => setPanel((p) => (p === "gif" ? "" : "gif"))}
                className={`${roundBtn} text-[11px] font-bold ${panel === "gif" ? "bg-yt-cta/10" : ""}`}
                title="GIF"
              >
                GIF
              </button>
              <button
                type="button"
                onClick={() => setPanel((p) => (p === "emoji" ? "" : "emoji"))}
                className={`${roundBtn} ${panel === "emoji" ? "bg-yt-cta/10" : ""}`}
                title={t("thread.compose.emoji")}
              >
                <Smile size={18} />
              </button>
              <button
                type="button"
                onClick={() => setPoll((p) => (p ? null : { options: ["", ""], endsAt: null }))}
                className={`${roundBtn} ${poll ? "bg-yt-cta/10" : ""}`}
                title={t("thread.compose.poll")}
              >
                <BarChart3 size={18} />
              </button>
              <button
                type="button"
                onClick={() => setShowLocation((v) => !v)}
                className={`${roundBtn} ${showLocation ? "bg-yt-cta/10" : ""}`}
                title={t("thread.compose.location")}
              >
                <MapPin size={18} />
              </button>
              <label className={`${roundBtn} cursor-pointer`} title={t("thread.compose.audio")}>
                {audioUploading ? (
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-yt-cta border-t-transparent" />
                ) : (
                  <Music2 size={18} />
                )}
                <input
                  type="file"
                  accept="audio/*"
                  className="hidden"
                  disabled={audioUploading}
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) void upload(f, "audio");
                    e.target.value = "";
                  }}
                />
              </label>
            </div>

            {!isLoggedIn && (
              <div className="flex flex-col gap-2 border-t border-yt-outline px-4 py-3">
                <input
                  value={anonName}
                  onChange={(e) => setAnonName(e.target.value)}
                  placeholder={t("thread.anonNamePlaceholder")}
                  aria-label={t("thread.anonName")}
                  className="w-full rounded-lg border border-yt-outline bg-yt-base px-3 py-2 text-sm outline-none transition-colors focus:border-yt-searchborder placeholder:text-yt-text2"
                />
                {siteKey && <Turnstile siteKey={siteKey} />}
              </div>
            )}

            <footer className="relative flex items-center justify-between border-t border-yt-outline px-4 py-3">
              <button
                type="button"
                onClick={() => setShowOptions((v) => !v)}
                className="text-sm font-medium text-yt-text2 transition-colors hover:text-yt-text"
              >
                {t("thread.compose.postOptions")}
              </button>

              {showOptions && (
                <div className="absolute bottom-full left-4 mb-2 w-64 rounded-2xl border border-yt-outline bg-yt-menu p-2 shadow-[0_16px_48px_rgba(0,0,0,0.4)]">
                  <button
                    type="button"
                    onClick={() => setGhost((v) => !v)}
                    className="flex w-full items-center justify-between gap-2 rounded-xl px-3 py-2 text-left text-sm transition-colors hover:bg-yt-hover"
                  >
                    <span className="flex items-center gap-2">
                      <Ghost size={16} className="text-yt-text2" />
                      {t("thread.compose.ghost")}
                    </span>
                    <span
                      className={`grid h-5 w-9 items-center rounded-full px-0.5 transition-colors ${ghost ? "bg-yt-cta" : "bg-yt-chip"}`}
                    >
                      <span
                        className={`h-4 w-4 rounded-full bg-white transition-transform ${ghost ? "translate-x-4" : ""}`}
                      />
                    </span>
                  </button>
                  <p className="px-3 pb-1 pt-2 text-xs text-yt-text2">
                    {t("thread.compose.replySetting")}
                  </p>
                </div>
              )}

              <button
                type="button"
                onClick={submit}
                disabled={pending || !hasContent}
                className="h-9 rounded-full bg-yt-cta px-5 text-sm font-semibold text-yt-cta-text transition-opacity hover:opacity-90 disabled:bg-yt-chip disabled:text-yt-text2 disabled:opacity-100"
              >
                {pending ? t("thread.compose.submitting") : t("thread.compose.post")}
              </button>
            </footer>
          </div>
        </div>
      )}
    </>
  );
}
