"use client";

import { useT } from "@/components/i18n/I18nProvider";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import { updateProfileAction } from "@/app/(shell)/settings/actions";
import ImageOverlayPicker from "@/components/usersettings/ImageOverlayPicker";

type Profile = {
  name: string;
  username: string;
  bio: string;
  image: string | null;
  banner: string | null;
};

const INPUT_CLS =
  "mt-1 h-10 w-full rounded-lg border border-yt-outline bg-transparent px-3 text-sm outline-none focus:border-yt-cta";

export default function ProfileForm({ initial }: { initial: Profile }) {
  const t = useT();
  const router = useRouter();
  const [value, setValue] = useState(initial);
  const [saved, setSaved] = useState(initial);
  const [pending, startTransition] = useTransition();
  const dirty = JSON.stringify(value) !== JSON.stringify(saved);

  function set<K extends keyof Profile>(key: K, v: Profile[K]) {
    setValue((s) => ({ ...s, [key]: v }));
  }

  function save() {
    if (!value.name.trim()) {
      toast.error(t("usersettings.nameRequired"));
      return;
    }
    startTransition(async () => {
      const res = await updateProfileAction(value);
      if ("error" in res) {
        toast.error(res.error);
      } else {
        setSaved(value);
        toast.success(t("usersettings.profileSaved"));
        router.refresh();
      }
    });
  }

  const username = value.username.trim().toLowerCase() || "username";

  return (
    <div className="space-y-6">
      <section className="rounded-xl border border-yt-outline bg-yt-raised p-5">
        <h2 className="text-base font-semibold">{t("usersettings.preview")}</h2>
        <p className="mt-1 text-sm text-yt-text2">{t("usersettings.previewHint")}</p>
        <ImageOverlayPicker
          value={value.banner}
          shape="banner"
          onChange={(url) => set("banner", url)}
          aspectRatio={6.2 / 1}
          className="mt-3 aspect-[6.2/1] w-full bg-gradient-to-r from-[#065fd4] via-[#3ea6ff] to-[#065fd4]"
        />
        <div className="mt-4 flex items-center gap-4">
          <ImageOverlayPicker
            value={value.image}
            shape="circle"
            onChange={(url) => set("image", url)}
            className="h-16 w-16 shrink-0 bg-yt-hover"
          />
          <div className="min-w-0">
            <p className="truncate text-lg font-bold">{value.name || t("usersettings.noName")}</p>
            <p className="truncate text-sm text-yt-text2">@{username}</p>
            {value.bio && <p className="line-clamp-1 text-sm text-yt-text2">{value.bio}</p>}
          </div>
        </div>
      </section>

      <section className="rounded-xl border border-yt-outline bg-yt-raised p-5">
        <h2 className="text-base font-semibold">{t("usersettings.profileInfo")}</h2>
        <div className="mt-3 max-w-md space-y-3">
          <label className="block text-sm">
            <span className="text-yt-text2">{t("usersettings.name")}</span>
            <input
              value={value.name}
              onChange={(e) => set("name", e.target.value)}
              className={INPUT_CLS}
            />
          </label>
          <label className="block text-sm">
            <span className="text-yt-text2">{t("usersettings.username")}</span>
            <input
              value={value.username}
              onChange={(e) => set("username", e.target.value)}
              className={INPUT_CLS}
            />
            <span className="mt-1 block text-xs text-yt-text2">
              {t("usersettings.profileUrl", { username })}
            </span>
          </label>
          <label className="block text-sm">
            <span className="text-yt-text2">{t("usersettings.bio")}</span>
            <textarea
              value={value.bio}
              onChange={(e) => set("bio", e.target.value)}
              rows={4}
              className="mt-1 w-full rounded-lg border border-yt-outline bg-transparent px-3 py-2 text-sm outline-none focus:border-yt-cta"
            />
          </label>
        </div>
      </section>

      <div className="flex justify-end">
        <button
          type="button"
          onClick={save}
          disabled={!dirty || pending}
          className="h-10 rounded-full bg-yt-cta px-5 text-sm font-medium text-white disabled:opacity-50"
        >
          {pending ? t("usersettings.saving") : t("usersettings.save")}
        </button>
      </div>
    </div>
  );
}
