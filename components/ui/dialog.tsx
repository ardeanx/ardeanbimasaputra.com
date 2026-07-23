"use client";

import { useEffect, useRef, useState } from "react";

type ConfirmReq = {
  kind: "confirm";
  title: string;
  body?: string;
  confirmLabel?: string;
  danger?: boolean;
  resolve: (ok: boolean) => void;
};
type InputReq = {
  kind: "input";
  title: string;
  placeholder?: string;
  initial?: string;
  confirmLabel?: string;
  resolve: (value: string | null) => void;
};
type Req = ConfirmReq | InputReq;

let pushReq: ((req: Req) => void) | null = null;

export function askConfirm(opts: {
  title: string;
  body?: string;
  confirmLabel?: string;
  danger?: boolean;
}): Promise<boolean> {
  return new Promise((resolve) => {
    if (!pushReq) return resolve(window.confirm(opts.title));
    pushReq({ kind: "confirm", ...opts, resolve });
  });
}

export function askInput(opts: {
  title: string;
  placeholder?: string;
  initial?: string;
  confirmLabel?: string;
}): Promise<string | null> {
  return new Promise((resolve) => {
    if (!pushReq) return resolve(window.prompt(opts.title, opts.initial ?? ""));
    pushReq({ kind: "input", ...opts, resolve });
  });
}

export default function DialogHost() {
  const [req, setReq] = useState<Req | null>(null);
  const [value, setValue] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    pushReq = (r) => {
      setValue(r.kind === "input" ? (r.initial ?? "") : "");
      setReq((prev) => {
        if (prev) {
          if (prev.kind === "confirm") prev.resolve(false);
          else prev.resolve(null);
        }
        return r;
      });
    };
    return () => {
      pushReq = null;
    };
  }, []);

  useEffect(() => {
    if (!req) return;
    if (req.kind === "input") inputRef.current?.focus();
    else wrapRef.current?.focus();
  }, [req]);

  if (!req) return null;

  function close(cancelled: boolean) {
    if (!req) return;
    if (req.kind === "confirm") req.resolve(!cancelled);
    else req.resolve(cancelled ? null : value);
    setReq(null);
  }

  function submit() {
    close(false);
  }

  return (
    <div
      ref={wrapRef}
      tabIndex={-1}
      className="fixed inset-0 z-[120] grid place-items-center p-4 outline-none"
      onKeyDown={(e) => {
        if (e.key === "Escape") close(true);
        if (e.key === "Enter") submit();
      }}
    >
      <button
        type="button"
        aria-label="Tutup dialog"
        onClick={() => close(true)}
        className="absolute inset-0 cursor-default bg-black/60"
      />
      <div className="relative w-full max-w-sm rounded-2xl bg-yt-menu p-5 shadow-[0_8px_48px_rgba(0,0,0,0.4)]">
        <h2 className="text-base font-semibold">{req.title}</h2>
        {req.kind === "confirm" && req.body && (
          <p className="mt-2 text-sm text-yt-text2">{req.body}</p>
        )}
        {req.kind === "input" && (
          <input
            ref={inputRef}
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder={req.placeholder}
            className="mt-3 w-full rounded-lg border border-yt-outline bg-transparent px-3 py-2 text-sm outline-none focus:border-yt-cta"
          />
        )}
        <div className="mt-5 flex justify-end gap-2">
          <button
            type="button"
            onClick={() => close(true)}
            className="h-9 rounded-full px-4 text-sm font-medium hover:bg-yt-hover"
          >
            Batal
          </button>
          <button
            type="button"
            onClick={submit}
            className={`h-9 rounded-full px-4 text-sm font-medium text-white ${
              req.kind === "confirm" && req.danger
                ? "bg-red-600 hover:bg-red-700"
                : "bg-yt-cta hover:brightness-110"
            }`}
          >
            {req.confirmLabel ?? "OK"}
          </button>
        </div>
      </div>
    </div>
  );
}
