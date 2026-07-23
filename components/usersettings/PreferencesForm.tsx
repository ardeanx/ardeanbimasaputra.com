"use client";

import { useT } from "@/components/i18n/I18nProvider";
import { useTheme } from "next-themes";
import { useEffect, useState, useSyncExternalStore, useTransition } from "react";
import { toast } from "sonner";
import { setLangAction } from "@/app/(shell)/settings/actions";
import Select from "@/components/ui/Select";

const noopSubscribe = () => () => {};

const LANGS = [
  { value: "id", label: "Bahasa Indonesia" },
  { value: "en", label: "English" },
];

function urlBase64ToUint8Array(base64: string): Uint8Array<ArrayBuffer> {
  const padding = "=".repeat((4 - (base64.length % 4)) % 4);
  const b64 = (base64 + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = atob(b64);
  const out = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i += 1) out[i] = raw.charCodeAt(i);
  return out;
}

export default function PreferencesForm({
  initialLang,
  vapidPublicKey = "",
}: {
  initialLang: string;
  vapidPublicKey?: string;
}) {
  const t = useT();
  const { theme, setTheme } = useTheme();
  const mounted = useSyncExternalStore(
    noopSubscribe,
    () => true,
    () => false,
  );
  const pushSupported = useSyncExternalStore(
    noopSubscribe,
    () => "serviceWorker" in navigator && "PushManager" in window,
    () => false,
  );
  const [saved, setSaved] = useState(initialLang);
  const [lang, setLang] = useState(initialLang);
  const [pending, startTransition] = useTransition();
  const [push, setPush] = useState<"init" | "unsupported" | "off" | "on" | "busy">("init");
  const dirty = lang !== saved;

  const themes: [string, string][] = [
    ["system", t("usersettings.theme.system")],
    ["light", t("usersettings.theme.light")],
    ["dark", t("usersettings.theme.dark")],
  ];

  useEffect(() => {
    if (!vapidPublicKey || !mounted) return;
    if (!pushSupported) {
      const tm = setTimeout(() => setPush("unsupported"), 0);
      return () => clearTimeout(tm);
    }
    navigator.serviceWorker
      .getRegistration()
      .then((reg) => reg?.pushManager.getSubscription())
      .then((sub) => setPush(sub ? "on" : "off"))
      .catch(() => setPush("off"));
  }, [vapidPublicKey, mounted, pushSupported]);

  function enablePush() {
    setPush("busy");
    (async () => {
      const perm = await Notification.requestPermission();
      if (perm !== "granted") {
        toast.error(t("usersettings.push.permissionDenied"));
        setPush("off");
        return;
      }
      const reg = await navigator.serviceWorker.register("/sw.js");
      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapidPublicKey),
      });
      const res = await fetch("/api/push/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(sub.toJSON()),
      });
      if (!res.ok) throw new Error("subscribe");
      setPush("on");
      toast.success(t("usersettings.push.enabled"));
    })().catch(() => {
      toast.error(t("usersettings.push.enableFailed"));
      setPush("off");
    });
  }

  function disablePush() {
    setPush("busy");
    (async () => {
      const reg = await navigator.serviceWorker.getRegistration();
      const sub = await reg?.pushManager.getSubscription();
      if (sub) {
        await fetch("/api/push/subscribe", {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ endpoint: sub.endpoint }),
        });
        await sub.unsubscribe();
      }
      setPush("off");
      toast.success(t("usersettings.push.disabled"));
    })().catch(() => {
      toast.error(t("usersettings.push.disableFailed"));
      setPush("on");
    });
  }

  function save() {
    startTransition(async () => {
      const res = await setLangAction(lang);
      if ("error" in res) {
        toast.error(res.error);
      } else {
        setSaved(lang);
        toast.success(t("usersettings.lang.saved"));
      }
    });
  }

  return (
    <div className="space-y-6">
      <section className="rounded-xl border border-yt-outline bg-yt-raised p-5">
        <h2 className="text-base font-semibold">{t("usersettings.lang.title")}</h2>
        <p className="mt-1 text-sm text-yt-text2">{t("usersettings.lang.desc")}</p>
        <div className="mt-3 max-w-xs">
          <Select
            value={lang}
            options={LANGS}
            onChange={setLang}
            ariaLabel={t("usersettings.lang.aria")}
          />
        </div>
        <div className="mt-4 flex justify-end">
          <button
            type="button"
            onClick={save}
            disabled={!dirty || pending}
            className="h-10 rounded-full bg-yt-cta px-5 text-sm font-medium text-white disabled:opacity-50"
          >
            {pending ? t("usersettings.saving") : t("usersettings.save")}
          </button>
        </div>
      </section>

      <section className="rounded-xl border border-yt-outline bg-yt-raised p-5">
        <h2 className="text-base font-semibold">{t("usersettings.theme.title")}</h2>
        <p className="mt-1 text-sm text-yt-text2">{t("usersettings.theme.desc")}</p>
        <div role="radiogroup" aria-label={t("usersettings.theme.aria")} className="mt-3 space-y-1">
          {themes.map(([value, label]) => (
            <button
              key={value}
              type="button"
              role="radio"
              aria-checked={mounted && theme === value}
              onClick={() => setTheme(value)}
              className="flex w-full items-center rounded-lg px-3 py-2 text-left text-sm hover:bg-yt-hover"
            >
              <span className="w-6">{mounted && theme === value ? "✓" : ""}</span>
              {label}
            </button>
          ))}
        </div>
      </section>

      {vapidPublicKey && (
        <section className="rounded-xl border border-yt-outline bg-yt-raised p-5">
          <h2 className="text-base font-semibold">{t("usersettings.push.title")}</h2>
          <p className="mt-1 text-sm text-yt-text2">{t("usersettings.push.desc")}</p>
          <div className="mt-4">
            {push === "unsupported" ? (
              <p className="text-sm text-yt-text2">{t("usersettings.push.unsupported")}</p>
            ) : (
              <button
                type="button"
                onClick={push === "on" ? disablePush : enablePush}
                disabled={push === "busy" || push === "init"}
                className={`h-10 rounded-full px-5 text-sm font-medium disabled:opacity-50 ${
                  push === "on" ? "bg-yt-chip hover:bg-yt-chip-hover" : "bg-yt-cta text-white"
                }`}
              >
                {push === "busy"
                  ? t("usersettings.processing")
                  : push === "on"
                    ? t("usersettings.push.disable")
                    : t("usersettings.push.enable")}
              </button>
            )}
          </div>
        </section>
      )}
    </div>
  );
}
