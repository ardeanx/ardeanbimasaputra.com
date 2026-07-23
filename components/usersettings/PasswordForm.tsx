"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { changePasswordAction } from "@/app/(shell)/settings/actions";

const INPUT_CLS =
  "mt-1 h-10 w-full rounded-lg border border-yt-outline bg-transparent px-3 text-sm outline-none focus:border-yt-cta";

export default function PasswordForm() {
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [pending, startTransition] = useTransition();
  const dirty = current !== "" || next !== "" || confirm !== "";

  function submit() {
    if (!current) {
      toast.error("Password lama wajib diisi.");
      return;
    }
    if (next.length < 8) {
      toast.error("Password baru minimal 8 karakter.");
      return;
    }
    if (next !== confirm) {
      toast.error("Konfirmasi password tidak cocok.");
      return;
    }
    startTransition(async () => {
      const res = await changePasswordAction({
        currentPassword: current,
        newPassword: next,
      });
      if ("error" in res) {
        toast.error(res.error);
      } else {
        toast.success("Password berhasil diganti. Sesi lain telah diakhiri.");
        setCurrent("");
        setNext("");
        setConfirm("");
      }
    });
  }

  return (
    <div className="mt-3 max-w-md space-y-3">
      <label className="block text-sm">
        <span className="text-yt-text2">Password lama</span>
        <input
          type="password"
          value={current}
          autoComplete="current-password"
          onChange={(e) => setCurrent(e.target.value)}
          className={INPUT_CLS}
        />
      </label>
      <label className="block text-sm">
        <span className="text-yt-text2">Password baru</span>
        <input
          type="password"
          value={next}
          autoComplete="new-password"
          onChange={(e) => setNext(e.target.value)}
          className={INPUT_CLS}
        />
      </label>
      <label className="block text-sm">
        <span className="text-yt-text2">Konfirmasi password baru</span>
        <input
          type="password"
          value={confirm}
          autoComplete="new-password"
          onChange={(e) => setConfirm(e.target.value)}
          className={INPUT_CLS}
        />
      </label>
      <div className="flex justify-end pt-1">
        <button
          type="button"
          onClick={submit}
          disabled={!dirty || pending}
          className="h-10 rounded-full bg-yt-cta px-5 text-sm font-medium text-white disabled:opacity-50"
        >
          {pending ? "Menyimpan..." : "Simpan"}
        </button>
      </div>
    </div>
  );
}
