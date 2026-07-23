"use client";

import { useState } from "react";

export default function ResourceTabs({
  detailLabel,
  filesLabel,
  detail,
  files,
}: {
  detailLabel: string;
  filesLabel: string;
  detail: React.ReactNode;
  files: React.ReactNode;
}) {
  const [tab, setTab] = useState<"detail" | "files">("detail");

  return (
    <>
      <div className="flex gap-6 border-b border-yt-outline">
        {(
          [
            ["detail", detailLabel],
            ["files", filesLabel],
          ] as const
        ).map(([key, label]) => (
          <button
            key={key}
            type="button"
            onClick={() => setTab(key)}
            className={`-mb-px border-b-2 py-3 text-sm font-medium transition-colors ${
              tab === key
                ? "border-yt-text text-yt-text"
                : "border-transparent text-yt-text2 hover:text-yt-text"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      <div className={tab === "detail" ? "mt-6" : "hidden"}>{detail}</div>
      <div className={tab === "files" ? "mt-6" : "hidden"}>{files}</div>
    </>
  );
}
