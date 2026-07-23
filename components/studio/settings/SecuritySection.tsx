"use client";

import { useRouter } from "next/navigation";
import { forwardRef, useImperativeHandle, useState } from "react";
import { toast } from "sonner";
import {
  revokeAllSessionsAction,
  saveSettingsAction,
} from "@/app/(studio)/studio/settings/actions";
import { askConfirm } from "@/components/ui/dialog";
import { useFmt, useT } from "@/components/i18n/I18nProvider";
import type { AppSettings } from "@/lib/settings";
import { GroupTitle, NumberField, Row, type SaveHandle } from "./forms";

type Security = AppSettings["security"];

export type SessionRow = {
  id: string;
  name: string;
  userAgent: string | null;
  ipAddress: string | null;
  createdAt: string;
  current: boolean;
};

function uaShort(ua: string | null, unknown: string): string {
  if (!ua) return unknown;
  const browser = /Edg\//.test(ua)
    ? "Edge"
    : /OPR\//.test(ua)
      ? "Opera"
      : /Firefox\//.test(ua)
        ? "Firefox"
        : /Chrome\//.test(ua)
          ? "Chrome"
          : /Safari\//.test(ua)
            ? "Safari"
            : "Browser";
  const os = /Windows/.test(ua)
    ? "Windows"
    : /Android/.test(ua)
      ? "Android"
      : /iPhone|iPad/.test(ua)
        ? "iOS"
        : /Mac OS/.test(ua)
          ? "macOS"
          : /Linux/.test(ua)
            ? "Linux"
            : "";
  return os ? `${browser} · ${os}` : browser;
}

const SecuritySection = forwardRef<SaveHandle, { security: Security; sessions: SessionRow[] }>(
  function SecuritySection({ security, sessions }, ref) {
    const router = useRouter();
    const t = useT();
    const fmt = useFmt();
    const [s, setS] = useState(security);
    const [revoking, setRevoking] = useState(false);

    function patch<K extends keyof Security>(k: K, v: Security[K]) {
      setS((p) => ({ ...p, [k]: v }));
    }

    async function save() {
      const res = await saveSettingsAction({ security: s });
      if ("error" in res) {
        toast.error(res.error);
        return false;
      }
      return true;
    }
    useImperativeHandle(ref, () => ({ save }));

    async function revokeAll() {
      const ok = await askConfirm({
        title: t("settings.security.revokeTitle"),
        body: t("settings.security.revokeBody"),
        confirmLabel: t("settings.security.revokeAll"),
        danger: true,
      });
      if (!ok) return;
      setRevoking(true);
      const res = await revokeAllSessionsAction();
      setRevoking(false);
      if ("error" in res) toast.error(res.error);
      else {
        toast.success(t("settings.security.revoked", { count: res.count }));
        router.refresh();
      }
    }

    return (
      <>
        <div className="min-h-0 flex-1 overflow-y-auto px-8 py-5">
          <Row
            label={t("settings.security.maxLoginAttempts")}
            hint={t("settings.security.maxLoginAttemptsHint")}
          >
            <NumberField
              ariaLabel={t("settings.security.maxLoginAttempts")}
              value={s.maxLoginAttempts}
              min={3}
              max={20}
              onChange={(v) => patch("maxLoginAttempts", v)}
            />
          </Row>
          <Row label={t("settings.security.lockoutDuration")}>
            <NumberField
              ariaLabel={t("settings.security.lockoutDuration")}
              value={s.lockoutMinutes}
              min={1}
              max={1440}
              onChange={(v) => patch("lockoutMinutes", v)}
            />
          </Row>
          <Row label={t("settings.security.minPassword")}>
            <NumberField
              ariaLabel={t("settings.security.minPassword")}
              value={s.minPasswordLength}
              min={6}
              max={64}
              onChange={(v) => patch("minPasswordLength", v)}
            />
          </Row>

          <div className="mt-2 flex items-center justify-between">
            <GroupTitle>{t("settings.security.activeSessions", { n: sessions.length })}</GroupTitle>
            <button
              type="button"
              disabled={revoking}
              onClick={revokeAll}
              className="h-8 rounded-full border border-yt-outline px-4 text-sm font-medium text-red-500 transition hover:bg-yt-hover disabled:opacity-50"
            >
              {revoking ? t("settings.security.revoking") : t("settings.security.revokeAll")}
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-yt-outline text-left text-xs text-yt-text2">
                  <th className="py-2 pr-3 font-medium">{t("settings.security.user")}</th>
                  <th className="py-2 pr-3 font-medium">{t("settings.device")}</th>
                  <th className="py-2 pr-3 font-medium">{t("settings.ipAddress")}</th>
                  <th className="py-2 pr-3 font-medium">{t("settings.signedIn")}</th>
                  <th className="py-2 font-medium" />
                </tr>
              </thead>
              <tbody>
                {sessions.map((row) => (
                  <tr key={row.id} className="border-b border-yt-outline/60">
                    <td className="py-2.5 pr-3 font-medium">{row.name}</td>
                    <td className="py-2.5 pr-3 text-yt-text2">
                      {uaShort(row.userAgent, t("settings.unknown"))}
                    </td>
                    <td className="py-2.5 pr-3 text-yt-text2">{row.ipAddress || "-"}</td>
                    <td className="py-2.5 pr-3 text-yt-text2">{fmt.ago(row.createdAt)}</td>
                    <td className="py-2.5">
                      {row.current && (
                        <span className="rounded-full bg-yt-cta/15 px-2 py-0.5 text-xs font-medium text-yt-cta">
                          {t("settings.thisSession")}
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
                {sessions.length === 0 && (
                  <tr>
                    <td colSpan={5} className="py-4 text-center text-yt-text2">
                      {t("settings.security.noSessions")}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </>
    );
  },
);

export default SecuritySection;
