"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import {
  deleteResourceFileAction,
  importGithubAction,
  listResourceFilesAction,
} from "@/app/(studio)/studio/resource-actions";
import { useT } from "@/components/i18n/I18nProvider";
import { fmtBytes } from "@/lib/format";

type F = {
  id: string;
  filename: string;
  version: number;
  size: number;
  sha256: string;
};

export default function ResourceManager({ postId }: { postId: string }) {
  const t = useT();
  const [files, setFiles] = useState<F[]>([]);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [repo, setRepo] = useState("");
  const [importing, setImporting] = useState(false);
  const [, start] = useTransition();
  const inputRef = useRef<HTMLInputElement>(null);

  function importRepo() {
    const r = repo.trim();
    if (!r) return;
    setError(null);
    setImporting(true);
    start(async () => {
      const res = await importGithubAction(postId, r);
      setImporting(false);
      if ("error" in res) {
        setError(res.error ?? t("editor.importFailed"));
        return;
      }
      setFiles(res.files as F[]);
      setRepo("");
    });
  }

  useEffect(() => {
    listResourceFilesAction(postId).then((f) => setFiles(f as F[]));
  }, [postId]);

  function upload(file: File) {
    setError(null);
    setUploading(true);
    const form = new FormData();
    form.append("postId", postId);
    form.append("file", file);
    fetch("/api/resources", { method: "POST", body: form })
      .then(async (r) => {
        setUploading(false);
        const data = await r.json().catch(() => ({}));
        if (!r.ok) {
          setError(data.error ?? t("editor.uploadFailed"));
          return;
        }
        setFiles(data.files as F[]);
      })
      .catch(() => {
        setUploading(false);
        setError(t("editor.uploadFailed"));
      });
  }

  return (
    <div>
      <ul className="mb-3 space-y-2">
        {files.length === 0 && <li className="text-xs text-yt-text2">{t("editor.noFiles")}</li>}
        {files.map((f) => (
          <li
            key={f.id}
            className="flex items-center gap-2 rounded-lg border border-yt-outline p-2 text-sm"
          >
            <span className="min-w-0 flex-1">
              <span className="line-clamp-1 font-medium">{f.filename}</span>
              <span className="block text-xs text-yt-text2">
                v{f.version} · {fmtBytes(f.size)}
              </span>
            </span>
            <a href={`/api/download/${f.id}`} className="text-xs text-yt-cta hover:underline">
              {t("resource.download")}
            </a>
            <button
              type="button"
              onClick={() =>
                start(async () => {
                  const res = await deleteResourceFileAction(f.id);
                  if ("ok" in res) setFiles((cur) => cur.filter((x) => x.id !== f.id));
                  else setError(res.error);
                })
              }
              className="text-xs text-red-500 hover:underline"
            >
              {t("common.delete")}
            </button>
          </li>
        ))}
      </ul>
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        disabled={uploading}
        className="h-9 w-full rounded-full bg-yt-chip text-sm font-medium hover:bg-yt-chip-hover disabled:opacity-50"
      >
        {uploading ? t("editor.uploading") : t("editor.uploadNewVersion")}
      </button>
      <input
        ref={inputRef}
        type="file"
        hidden
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) upload(f);
          e.target.value = "";
        }}
      />
      <div className="mt-2 flex gap-1">
        <input
          value={repo}
          onChange={(e) => setRepo(e.target.value)}
          placeholder={t("editor.repoImportPlaceholder")}
          className="min-w-0 flex-1 rounded border border-yt-outline bg-transparent px-2 py-1.5 text-xs outline-none focus:border-yt-cta"
        />
        <button
          type="button"
          onClick={importRepo}
          disabled={importing}
          className="shrink-0 rounded bg-yt-chip px-2 text-xs font-medium hover:bg-yt-chip-hover disabled:opacity-50"
        >
          {importing ? t("editor.importing") : t("editor.import")}
        </button>
      </div>
      {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
      <p className="mt-2 text-xs text-yt-text2">{t("editor.resourceHint")}</p>
    </div>
  );
}
