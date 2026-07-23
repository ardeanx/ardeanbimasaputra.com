"use client";

import { useEditor } from "@tiptap/react";
import { useActionState, useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { savePostAction } from "@/app/(studio)/studio/actions";
import { editorExtensions } from "@/lib/editor/extensions";
import { insertImageFiles } from "@/lib/editor/upload";
import Canvas from "./Canvas";
import {
  EditorContext,
  type EditorMeta,
  type EditorUi,
  type PostType,
  type Visibility,
} from "./context";
import EditorTopbar from "./EditorTopbar";
import ImageDialogHost from "./ImageDialog";
import InserterPanel from "./InserterPanel";
import SettingsSidebar from "./SettingsSidebar";

const EMPTY = JSON.stringify({ type: "doc", content: [] });

export type EditorDefaults = {
  id?: string;
  status: string;
  title: string;
  type: PostType;
  slug: string;
  categoryId: number | null;
  excerpt: string | null;
  thumbnail: string | null;
  visibility: Visibility;
  mediaUrl: string | null;
  durationSec: number | null;
  repoUrl: string | null;
  seoTitle: string | null;
  seoDescription: string | null;
  ogImage: string | null;
  canonicalUrl: string | null;
  noindex: boolean;
  viewCount?: number;
  body: unknown;
};

export default function EditorRoot({
  defaults,
  categories,
  isAdmin,
  locales,
  defaultLocale,
}: {
  defaults: EditorDefaults;
  categories: { id: number; name: string }[];
  isAdmin: boolean;
  locales: string[];
  defaultLocale: string;
}) {
  const [state, action, pending] = useActionState(savePostAction, null);
  const [json, setJson] = useState(() =>
    defaults.body && typeof defaults.body === "object" ? JSON.stringify(defaults.body) : EMPTY,
  );
  const [tick, setTick] = useState(0);

  const [meta, setMetaState] = useState<EditorMeta>({
    id: defaults.id,
    status: defaults.status,
    title: defaults.title,
    type: defaults.type,
    slug: defaults.slug,
    categoryId: defaults.categoryId,
    excerpt: defaults.excerpt ?? "",
    thumbnail: defaults.thumbnail ?? "",
    visibility: defaults.visibility,
    mediaUrl: defaults.mediaUrl ?? "",
    durationSec: defaults.durationSec != null ? String(defaults.durationSec) : "",
    repoUrl: defaults.repoUrl ?? "",
    seoTitle: defaults.seoTitle ?? "",
    seoDescription: defaults.seoDescription ?? "",
    ogImage: defaults.ogImage ?? "",
    canonicalUrl: defaults.canonicalUrl ?? "",
    noindex: defaults.noindex,
    viewCount: String(defaults.viewCount ?? 0),
  });
  const setMeta = useCallback(
    (patch: Partial<EditorMeta>) => setMetaState((m) => ({ ...m, ...patch })),
    [],
  );

  const [ui, setUiState] = useState<EditorUi>({
    inserter: false,
    sidebar: true,
    tab: "post",
    distractionFree: false,
    codeView: false,
  });
  const setUi = useCallback(
    (patch: Partial<EditorUi>) => setUiState((u) => ({ ...u, ...patch })),
    [],
  );

  const editor = useEditor({
    immediatelyRender: false,
    extensions: editorExtensions(),
    content: defaults.body && typeof defaults.body === "object" ? defaults.body : "",
    editorProps: {
      attributes: { class: "tiptap" },
      handlePaste: (view, event) => insertImageFiles(view, event.clipboardData?.files),
      handleDrop: (view, event, _slice, moved) => {
        if (moved) return false;
        const pos = view.posAtCoords({
          left: event.clientX,
          top: event.clientY,
        })?.pos;
        return insertImageFiles(view, event.dataTransfer?.files, pos);
      },
    },
    onCreate: ({ editor }) => setJson(JSON.stringify(editor.getJSON())),
    onUpdate: ({ editor }) => setJson(JSON.stringify(editor.getJSON())),
  });

  useEffect(() => {
    if (!editor) return;
    const bump = () => setTick((t) => t + 1);
    editor.on("selectionUpdate", bump);
    editor.on("transaction", bump);
    return () => {
      editor.off("selectionUpdate", bump);
      editor.off("transaction", bump);
    };
  }, [editor]);

  const publishRef = useRef<HTMLButtonElement>(null);

  const [seenAt, setSeenAt] = useState(0);
  if (state && "ok" in state && state.at !== seenAt) {
    setSeenAt(state.at);
    setMeta({ id: state.id, status: state.status });
  }

  useEffect(() => {
    if (state && "ok" in state) {
      toast.success(
        state.status === "PUBLISHED"
          ? "Konten diterbitkan."
          : state.status === "REVIEW"
            ? "Terkirim untuk ditinjau."
            : "Draf tersimpan.",
      );
      if (state.created) window.history.replaceState(null, "", `/studio/${state.id}`);
    } else if (state && "error" in state) {
      toast.error(state.error);
    }
  }, [state]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "s") {
        e.preventDefault();
        publishRef.current?.click();
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const df = ui.distractionFree;

  return (
    <EditorContext.Provider
      value={{
        editor,
        meta,
        setMeta,
        ui,
        setUi,
        categories,
        locales,
        defaultLocale,
        isAdmin,
        pending,
        error: state && "error" in state ? state.error : undefined,
        tick,
      }}
    >
      <form action={action} className="fixed inset-0 z-[60] flex flex-col bg-yt-base">
        {meta.id && <input type="hidden" name="id" value={meta.id} />}
        <input type="hidden" name="title" value={meta.title} />
        <input type="hidden" name="type" value={meta.type} />
        <input type="hidden" name="slug" value={meta.slug} />
        <input type="hidden" name="categoryId" value={meta.categoryId ?? ""} />
        <input type="hidden" name="excerpt" value={meta.excerpt} />
        <input type="hidden" name="thumbnail" value={meta.thumbnail} />
        <input type="hidden" name="visibility" value={meta.visibility} />
        <input type="hidden" name="mediaUrl" value={meta.mediaUrl} />
        <input type="hidden" name="durationSec" value={meta.durationSec} />
        <input type="hidden" name="repoUrl" value={meta.repoUrl} />
        <input type="hidden" name="seoTitle" value={meta.seoTitle} />
        <input type="hidden" name="seoDescription" value={meta.seoDescription} />
        <input type="hidden" name="ogImage" value={meta.ogImage} />
        <input type="hidden" name="canonicalUrl" value={meta.canonicalUrl} />
        <input type="hidden" name="noindex" value={meta.noindex ? "1" : ""} />
        <input type="hidden" name="body" value={json} />
        <button
          ref={publishRef}
          type="submit"
          name="intent"
          value="publish"
          hidden
          disabled={pending}
        />

        <EditorTopbar />

        <div className="flex flex-1 overflow-hidden">
          {ui.inserter && !df && <InserterPanel />}
          <Canvas />
          {ui.sidebar && !df && <SettingsSidebar />}
        </div>
      </form>
      <ImageDialogHost />
    </EditorContext.Provider>
  );
}
