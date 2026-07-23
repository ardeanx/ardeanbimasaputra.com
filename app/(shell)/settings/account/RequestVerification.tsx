"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { createVerificationAction } from "@/app/(studio)/studio/verification/actions";
import { useT } from "@/components/i18n/I18nProvider";
import { CheckBadgeIcon } from "@/components/shell/icons";
import type { VerifyState } from "@/lib/verification";

const MAX_LINKS = 5;

export default function RequestVerification({ state }: { state: VerifyState }) {
  const t = useT();
  const [current, setCurrent] = useState<VerifyState>(state);
  const [message, setMessage] = useState("");
  const [links, setLinks] = useState<string[]>([""]);
  const [pending, start] = useTransition();

  const setLink = (i: number, v: string) =>
    setLinks((arr) => arr.map((l, idx) => (idx === i ? v : l)));

  const addLink = () => setLinks((arr) => (arr.length >= MAX_LINKS ? arr : [...arr, ""]));

  const removeLink = (i: number) =>
    setLinks((arr) => (arr.length <= 1 ? arr : arr.filter((_, idx) => idx !== i)));

  const submit = () =>
    start(async () => {
      const res = await createVerificationAction({ message, links });
      if ("error" in res) {
        toast.error(t(`verification.error.${res.error}`) || t("verification.error.generic"));
        if (res.error === "pending") setCurrent("pending");
        if (res.error === "already-verified") setCurrent("approved");
        return;
      }
      toast.success(t("verification.submitted"));
      setCurrent("pending");
      setMessage("");
      setLinks([""]);
    });

  return (
    <section className="rounded-xl border border-yt-outline bg-yt-raised p-5">
      <div className="flex items-center gap-2">
        <CheckBadgeIcon width={18} height={18} />
        <h2 className="text-base font-semibold">{t("verification.title")}</h2>
      </div>
      <p className="mt-1 text-sm text-yt-text2">{t("verification.desc")}</p>

      {current === "approved" ? (
        <p className="mt-4 rounded-lg bg-green-600/15 px-3 py-2 text-sm font-medium text-green-500">
          {t("verification.status.approved")}
        </p>
      ) : current === "pending" ? (
        <p className="mt-4 rounded-lg bg-yellow-600/15 px-3 py-2 text-sm font-medium text-yellow-600 dark:text-yellow-400">
          {t("verification.status.pending")}
        </p>
      ) : (
        <div className="mt-4 space-y-4">
          {current === "rejected" && (
            <p className="rounded-lg bg-red-600/15 px-3 py-2 text-sm font-medium text-red-500">
              {t("verification.status.rejected")}
            </p>
          )}

          <div>
            <label className="mb-1.5 block text-sm font-medium">
              {t("verification.messageLabel")}
            </label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={4}
              placeholder={t("verification.messagePlaceholder")}
              className="w-full resize-y rounded-lg border border-yt-outline bg-yt-base px-3 py-2 text-sm outline-none focus:border-yt-text2"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium">
              {t("verification.linksLabel")}
            </label>
            <div className="space-y-2">
              {links.map((l, i) => (
                <div key={i} className="flex gap-2">
                  <input
                    value={l}
                    onChange={(e) => setLink(i, e.target.value)}
                    placeholder={t("verification.linkPlaceholder")}
                    className="h-9 w-full rounded-lg border border-yt-outline bg-yt-base px-3 text-sm outline-none focus:border-yt-text2"
                  />
                  {links.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeLink(i)}
                      aria-label={t("verification.removeLink")}
                      className="h-9 shrink-0 rounded-lg border border-yt-outline px-3 text-sm hover:bg-yt-hover"
                    >
                      {t("verification.removeLink")}
                    </button>
                  )}
                </div>
              ))}
            </div>
            {links.length < MAX_LINKS && (
              <button
                type="button"
                onClick={addLink}
                className="mt-2 text-sm font-medium text-yt-cta hover:underline"
              >
                {t("verification.addLink")}
              </button>
            )}
          </div>

          <button
            type="button"
            onClick={submit}
            disabled={pending}
            className="h-9 rounded-full bg-yt-cta px-4 text-sm font-medium text-yt-cta-text disabled:opacity-50"
          >
            {t("verification.submit")}
          </button>
        </div>
      )}
    </section>
  );
}
