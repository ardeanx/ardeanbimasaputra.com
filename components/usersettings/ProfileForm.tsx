"use client";

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
      toast.error("Nama wajib diisi.");
      return;
    }
    startTransition(async () => {
      const res = await updateProfileAction(value);
      if ("error" in res) {
        toast.error(res.error);
      } else {
        setSaved(value);
        toast.success("Profil disimpan.");
        router.refresh();
      }
    });
  }

  return (
    <div className="space-y-6">
      <section className="rounded-xl border border-yt-outline bg-yt-raised p-5">
        <h2 className="text-base font-semibold">Pratinjau</h2>
        <p className="mt-1 text-sm text-yt-text2">
          Arahkan kursor ke banner atau avatar untuk menggantinya.
        </p>
        <ImageOverlayPicker
          value={value.banner}
          shape="banner"
          onChange={(url) => set("banner", url)}
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
            <p className="truncate text-lg font-bold">{value.name || "Tanpa nama"}</p>
            <p className="truncate text-sm text-yt-text2">
              @{value.username.trim().toLowerCase() || "username"}
            </p>
            {value.bio && <p className="line-clamp-1 text-sm text-yt-text2">{value.bio}</p>}
          </div>
        </div>
      </section>

      <section className="rounded-xl border border-yt-outline bg-yt-raised p-5">
        <h2 className="text-base font-semibold">Info profil</h2>
        <div className="mt-3 max-w-md space-y-3">
          <label className="block text-sm">
            <span className="text-yt-text2">Nama</span>
            <input
              value={value.name}
              onChange={(e) => set("name", e.target.value)}
              className={INPUT_CLS}
            />
          </label>
          <label className="block text-sm">
            <span className="text-yt-text2">Username</span>
            <input
              value={value.username}
              onChange={(e) => set("username", e.target.value)}
              className={INPUT_CLS}
            />
            <span className="mt-1 block text-xs text-yt-text2">
              Profil Anda: /@{value.username.trim().toLowerCase() || "username"}
            </span>
          </label>
          <label className="block text-sm">
            <span className="text-yt-text2">Bio</span>
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
          {pending ? "Menyimpan..." : "Simpan"}
        </button>
      </div>
    </div>
  );
}
