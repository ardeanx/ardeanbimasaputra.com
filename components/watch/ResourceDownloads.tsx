import { DownloadIcon } from "@/components/shell/icons";
import { fmtBytes } from "@/lib/format";
import { getT } from "@/lib/i18n";
import { listResourceFiles } from "@/lib/resources";

export default async function ResourceDownloads({ postId }: { postId: string }) {
  const t = await getT();
  const files = await listResourceFiles(postId);
  if (files.length === 0) return null;

  return (
    <section className="mt-4 rounded-xl border border-yt-outline p-4">
      <h2 className="mb-3 text-base font-semibold">
        {t("resource.filesHeading", { n: files.length })}
      </h2>
      <ul className="space-y-2">
        {files.map((f) => (
          <li key={f.id} className="flex items-center gap-3 text-sm">
            <span className="min-w-0 flex-1">
              <span className="line-clamp-1 font-medium">{f.filename}</span>
              <span className="block text-xs text-yt-text2">
                v{f.version} · {fmtBytes(f.size)} · sha256 {f.sha256.slice(0, 10)}…
              </span>
            </span>
            <a
              href={`/api/download/${f.id}`}
              className="flex h-9 shrink-0 items-center gap-1.5 rounded-full bg-yt-cta px-3.5 text-sm font-medium text-yt-cta-text"
            >
              <DownloadIcon width={18} height={18} /> {t("resource.download")}
            </a>
          </li>
        ))}
      </ul>
    </section>
  );
}
