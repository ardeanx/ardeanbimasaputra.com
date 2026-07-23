"use client";

import { useState } from "react";
import { useT } from "@/components/i18n/I18nProvider";
import Select from "@/components/ui/Select";

type Poll = { options: string[]; endsAt: string | null };

const DAY_MS = 86_400_000;

export default function PollComposer({
  value,
  onChange,
}: {
  value: Poll | null;
  onChange: (poll: Poll) => void;
}) {
  const t = useT();
  const [options, setOptions] = useState<string[]>(
    value?.options?.length ? value.options.slice(0, 4) : ["", ""],
  );
  const [dur, setDur] = useState("none");

  function emit(opts: string[], d: string) {
    const endsAt =
      d === "none" ? null : new Date(new Date().getTime() + Number(d) * DAY_MS).toISOString();
    onChange({
      options: opts.map((o) => o.trim()).filter(Boolean),
      endsAt,
    });
  }

  function setAt(i: number, v: string) {
    const next = options.map((o, k) => (k === i ? v : o));
    setOptions(next);
    emit(next, dur);
  }

  function add() {
    if (options.length >= 4) return;
    const next = [...options, ""];
    setOptions(next);
    emit(next, dur);
  }

  function remove(i: number) {
    if (options.length <= 2) return;
    const next = options.filter((_, k) => k !== i);
    setOptions(next);
    emit(next, dur);
  }

  const durOptions = [
    { value: "none", label: t("thread.poll.duration.none") },
    { value: "1", label: t("thread.poll.duration.1d") },
    { value: "3", label: t("thread.poll.duration.3d") },
    { value: "7", label: t("thread.poll.duration.7d") },
  ];

  return (
    <div className="flex flex-col gap-2 rounded-2xl border border-yt-outline bg-yt-raised p-3">
      {options.map((opt, i) => (
        <div key={i} className="flex items-center gap-2">
          <input
            value={opt}
            onChange={(e) => setAt(i, e.target.value)}
            placeholder={t("thread.poll.option", { n: i + 1 })}
            maxLength={80}
            className="h-9 flex-1 rounded-full border border-yt-searchborder bg-yt-base px-4 text-sm text-yt-text outline-none placeholder:text-yt-text2"
          />
          {options.length > 2 ? (
            <button
              type="button"
              onClick={() => remove(i)}
              aria-label={t("thread.poll.remove")}
              className="grid h-9 w-9 place-items-center rounded-full bg-yt-chip text-yt-text hover:bg-yt-chip-hover"
            >
              −
            </button>
          ) : null}
        </div>
      ))}
      <div className="flex items-center justify-between gap-2">
        {options.length < 4 ? (
          <button
            type="button"
            onClick={add}
            className="h-9 rounded-full bg-yt-chip px-4 text-sm text-yt-text hover:bg-yt-chip-hover"
          >
            {t("thread.poll.add")}
          </button>
        ) : (
          <span />
        )}
        <Select
          value={dur}
          options={durOptions}
          onChange={(v) => {
            setDur(v);
            emit(options, v);
          }}
          ariaLabel={t("thread.poll.duration")}
          className="w-36"
        />
      </div>
    </div>
  );
}
