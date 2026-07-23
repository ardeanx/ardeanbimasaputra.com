"use client";

import { Ban, LockOpen, Search, Shield, Trash2, User } from "lucide-react";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import {
  banUserAction,
  deleteUserAction,
  setRoleAction,
  unbanUserAction,
} from "@/app/(studio)/studio/users/actions";
import { useLocale, useT } from "@/components/i18n/I18nProvider";
import { askConfirm, askInput } from "@/components/ui/dialog";
import Select from "@/components/ui/Select";

export type UserRow = {
  id: string;
  name: string;
  username: string | null;
  email: string;
  image: string | null;
  role: string | null;
  banned: boolean;
  banReason: string | null;
  createdAt: string;
  postCount: number;
};

export default function UsersTable({
  data,
  adminCount,
  currentUserId,
}: {
  data: UserRow[];
  adminCount: number;
  currentUserId: string;
}) {
  const t = useT();
  const locale = useLocale();
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [roleOverride, setRoleOverride] = useState<Map<string, string>>(new Map());
  const [busy, setBusy] = useState<string | null>(null);

  const roleOptions = [
    { value: "member", label: t("studio.users.roleMember"), icon: <User size={16} /> },
    { value: "admin", label: t("studio.users.roleAdmin"), icon: <Shield size={16} /> },
  ];

  const formatDate = (iso: string) =>
    new Date(iso).toLocaleDateString(locale, {
      day: "numeric",
      month: "short",
      year: "numeric",
    });

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return data;
    return data.filter(
      (u) =>
        u.name.toLowerCase().includes(q) ||
        u.email.toLowerCase().includes(q) ||
        (u.username ?? "").toLowerCase().includes(q),
    );
  }, [data, query]);

  async function changeRole(u: UserRow, next: string) {
    const current = roleOverride.get(u.id) ?? u.role ?? "member";
    if (next === current) return;
    setRoleOverride((m) => new Map(m).set(u.id, next));
    const res = await setRoleAction(u.id, next as "member" | "admin");
    if ("error" in res) {
      setRoleOverride((m) => new Map(m).set(u.id, current));
      toast.error(res.error);
      return;
    }
    toast.success(t("studio.users.roleChanged", { name: u.name, role: next }));
    router.refresh();
  }

  async function ban(u: UserRow) {
    const ok = await askConfirm({
      title: t("studio.users.banTitle", { name: u.name }),
      body: t("studio.users.banBody"),
      confirmLabel: t("studio.users.ban"),
      danger: true,
    });
    if (!ok) return;
    const reason = await askInput({
      title: t("studio.users.banReasonTitle"),
      placeholder: t("studio.users.banReasonPlaceholder"),
    });
    if (reason === null) return;
    setBusy(u.id);
    const res = await banUserAction(u.id, reason.trim() || t("studio.users.banReasonDefault"));
    setBusy(null);
    if ("error" in res) {
      toast.error(res.error);
      return;
    }
    toast.success(t("studio.users.banned", { name: u.name }));
    router.refresh();
  }

  async function unban(u: UserRow) {
    setBusy(u.id);
    const res = await unbanUserAction(u.id);
    setBusy(null);
    if ("error" in res) {
      toast.error(res.error);
      return;
    }
    toast.success(t("studio.users.unbanned", { name: u.name }));
    router.refresh();
  }

  async function del(u: UserRow) {
    const ok = await askConfirm({
      title: t("studio.users.deleteTitle", { name: u.name }),
      body: t("studio.users.deleteBody"),
      confirmLabel: t("common.delete"),
      danger: true,
    });
    if (!ok) return;
    setBusy(u.id);
    const res = await deleteUserAction(u.id);
    setBusy(null);
    if ("error" in res) {
      toast.error(res.error);
      return;
    }
    toast.success(t("studio.users.deleted", { name: u.name }));
    router.refresh();
  }

  return (
    <div className="rounded-xl border border-yt-outline bg-yt-raised">
      <div className="border-b border-yt-outline/60 p-3">
        <div className="flex h-9 max-w-sm items-center gap-2 rounded-full border border-yt-outline bg-yt-base px-3">
          <Search size={16} className="shrink-0 text-yt-text2" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t("studio.users.searchPlaceholder")}
            aria-label={t("studio.users.searchAria")}
            className="w-full bg-transparent text-sm outline-none placeholder:text-yt-text2"
          />
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[860px] text-left">
          <thead>
            <tr className="border-b border-yt-outline/60 text-xs font-medium text-yt-text2">
              <th className="px-4 py-3">{t("studio.users.colUser")}</th>
              <th className="px-4 py-3">{t("studio.users.colEmail")}</th>
              <th className="px-4 py-3">{t("studio.users.colRole")}</th>
              <th className="px-4 py-3">{t("studio.users.colStatus")}</th>
              <th className="px-4 py-3">{t("studio.users.colContent")}</th>
              <th className="px-4 py-3">{t("studio.users.colJoined")}</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody>
            {filtered.map((u) => {
              const role = roleOverride.get(u.id) ?? u.role ?? "member";
              const isSelf = u.id === currentUserId;
              const lockedAdmin = role === "admin" && adminCount <= 1;
              return (
                <tr
                  key={u.id}
                  className="border-b border-yt-outline/60 last:border-b-0 hover:bg-yt-hover/60"
                >
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      {u.image ? (
                        <img
                          src={u.image}
                          alt=""
                          className="h-9 w-9 shrink-0 rounded-full object-cover"
                        />
                      ) : (
                        <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-yt-chip text-sm font-medium">
                          {u.name.charAt(0).toUpperCase()}
                        </span>
                      )}
                      <span className="min-w-0">
                        <span className="block truncate text-sm font-medium">
                          {u.name}
                          {isSelf && (
                            <span className="ml-1.5 text-xs text-yt-text2">
                              {t("studio.users.you")}
                            </span>
                          )}
                        </span>
                        {u.username && (
                          <span className="block truncate text-xs text-yt-text2">
                            @{u.username}
                          </span>
                        )}
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm text-yt-text2">{u.email}</td>
                  <td className="px-4 py-3">
                    <Select
                      value={role}
                      options={roleOptions}
                      onChange={(v) => changeRole(u, v)}
                      ariaLabel={t("studio.users.roleAria", { name: u.name })}
                      disabled={isSelf || lockedAdmin}
                      className="w-32"
                      buttonClassName="flex h-8 w-full items-center gap-2 rounded-full border border-yt-outline bg-transparent px-3 text-left text-xs hover:bg-yt-hover disabled:opacity-50"
                    />
                  </td>
                  <td className="px-4 py-3">
                    {u.banned ? (
                      <span className="inline-flex flex-col">
                        <span className="inline-flex w-fit items-center rounded-full bg-red-600/15 px-2.5 py-0.5 text-xs font-medium text-red-500">
                          {t("studio.users.statusBanned")}
                        </span>
                        {u.banReason && (
                          <span className="mt-1 max-w-44 truncate text-xs text-yt-text2">
                            {u.banReason}
                          </span>
                        )}
                      </span>
                    ) : (
                      <span className="inline-flex items-center rounded-full bg-green-600/15 px-2.5 py-0.5 text-xs font-medium text-green-500">
                        {t("studio.users.statusActive")}
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-sm text-yt-text2">{u.postCount}</td>
                  <td className="px-4 py-3 text-sm text-yt-text2">{formatDate(u.createdAt)}</td>
                  <td className="px-4 py-3">
                    {!isSelf && (
                      <div className="flex items-center gap-2">
                        {u.banned ? (
                          <button
                            type="button"
                            onClick={() => unban(u)}
                            disabled={busy === u.id}
                            className="inline-flex h-8 items-center gap-1.5 rounded-full border border-yt-outline px-3 text-xs font-medium hover:bg-yt-hover disabled:opacity-50"
                          >
                            <LockOpen size={16} />
                            {t("studio.users.unban")}
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={() => ban(u)}
                            disabled={busy === u.id || lockedAdmin}
                            className="inline-flex h-8 items-center gap-1.5 rounded-full border border-red-600/40 px-3 text-xs font-medium text-red-500 hover:bg-red-600/10 disabled:opacity-50"
                          >
                            <Ban size={16} />
                            {t("studio.users.ban")}
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => del(u)}
                          disabled={busy === u.id || lockedAdmin}
                          aria-label={t("studio.users.deleteAria", { name: u.name })}
                          className="inline-flex h-8 items-center gap-1.5 rounded-full border border-red-600/40 px-3 text-xs font-medium text-red-500 hover:bg-red-600/10 disabled:opacity-50"
                        >
                          <Trash2 size={16} />
                          {t("common.delete")}
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              );
            })}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-10 text-center text-sm text-yt-text2">
                  {t("studio.users.empty")}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
