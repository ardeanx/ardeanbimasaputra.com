"use client";

import { BellOff } from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo, useState, useTransition } from "react";
import { fetchNotificationsAction, markNotificationsReadAction } from "@/app/(shell)/actions";
import EmptyState from "@/components/ui/EmptyState";
import { useFmt, useT } from "@/components/i18n/I18nProvider";
import { BellIcon } from "./icons";

type Item = Awaited<ReturnType<typeof fetchNotificationsAction>>["items"][number];

type Tab = "all" | "announcements" | "socials" | "system";

const LABEL_KEY: Record<string, string> = {
  COMMENT: "notif.comment",
  REPLY: "notif.reply",
  FOLLOW: "notif.follow",
  LIKE: "notif.like",
  APPROVED: "notif.approved",
  REJECTED: "notif.rejected",
  NEW_CONTENT: "notif.newContent",
  NEW_USER: "notif.newUser",
  PURCHASE: "notif.purchase",
  ANNOUNCEMENT: "notif.announcement",
  SYSTEM: "notif.system",
};

const CATEGORY: Record<string, Exclude<Tab, "all">> = {
  COMMENT: "socials",
  REPLY: "socials",
  FOLLOW: "socials",
  LIKE: "socials",
  ANNOUNCEMENT: "announcements",
  NEW_CONTENT: "announcements",
  NEW_USER: "system",
  PURCHASE: "system",
  APPROVED: "system",
  REJECTED: "system",
  SYSTEM: "system",
};

const TABS: Tab[] = ["all", "announcements", "socials", "system"];

function metaStr(n: Item, key: string): string | undefined {
  const v = (n.meta as Record<string, unknown> | null)?.[key];
  return typeof v === "string" ? v : undefined;
}

function thumbOf(n: Item): string | undefined {
  return n.post?.thumbnail ?? metaStr(n, "image");
}

function subjectOf(n: Item): string | undefined {
  return n.post?.title ?? metaStr(n, "productTitle") ?? metaStr(n, "title");
}

function hrefOf(n: Item): string {
  if (n.type === "PURCHASE") {
    const slug = metaStr(n, "productSlug");
    return slug ? `/store/${slug}` : "/";
  }
  if ((n.type === "FOLLOW" || n.type === "NEW_USER") && n.actor?.username)
    return `/@${n.actor.username}`;
  if (n.postId) return `/watch?v=${n.postId}`;
  return "/";
}

export default function NotificationBell({ pollSec = 30 }: { pollSec?: number }) {
  const t = useT();
  const fmt = useFmt();
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState<Tab>("all");
  const [items, setItems] = useState<Item[]>([]);
  const [unread, setUnread] = useState(0);
  const [, start] = useTransition();

  useEffect(() => {
    let alive = true;
    const load = () =>
      fetchNotificationsAction().then((r) => {
        if (!alive) return;
        setItems(r.items);
        setUnread(r.unread);
      });
    load();
    const id = setInterval(load, Math.max(10, pollSec) * 1000);
    return () => {
      alive = false;
      clearInterval(id);
    };
  }, [pollSec]);

  const shown = useMemo(
    () => (tab === "all" ? items : items.filter((n) => CATEGORY[n.type] === tab)),
    [items, tab],
  );

  function toggle() {
    setOpen((o) => {
      const next = !o;
      if (next && unread > 0)
        start(async () => {
          await markNotificationsReadAction();
          setUnread(0);
        });
      return next;
    });
  }

  return (
    <div className="relative">
      <button
        onClick={toggle}
        aria-label={t("aria.notifications")}
        className="relative grid h-10 w-10 place-items-center rounded-full hover:bg-yt-hover"
      >
        <BellIcon />
        {unread > 0 && (
          <span className="absolute right-1.5 top-1.5 grid min-w-4 place-items-center rounded-full bg-yt-cta px-1 text-[10px] font-medium leading-4 text-yt-cta-text">
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </button>

      {open && (
        <>
          <button
            aria-label={t("aria.closeNotifications")}
            className="fixed inset-0 z-40 cursor-default"
            onClick={() => setOpen(false)}
          />
          <div className="absolute right-0 top-11 z-50 flex max-h-[70vh] w-96 flex-col overflow-hidden rounded-xl bg-yt-menu shadow-[0_4px_32px_rgba(0,0,0,0.25)]">
            <p className="px-4 pb-1 pt-3 text-base font-medium">{t("notif.title")}</p>
            <div className="flex gap-1 px-2 pb-2">
              {TABS.map((tk) => (
                <button
                  key={tk}
                  onClick={() => setTab(tk)}
                  className={`rounded-full px-3 py-1 text-sm ${
                    tab === tk
                      ? "bg-yt-text text-yt-base"
                      : "bg-yt-chip text-yt-text hover:bg-yt-hover"
                  }`}
                >
                  {t(`notif.tab.${tk}`)}
                </button>
              ))}
            </div>
            <div className="min-h-0 flex-1 overflow-y-auto pb-2">
              {shown.length === 0 ? (
                <EmptyState icon={<BellOff />} title={t("notif.empty")} className="py-8" />
              ) : (
                shown.map((n) => {
                  const thumb = thumbOf(n);
                  const subject = subjectOf(n);
                  return (
                    <Link
                      key={n.id}
                      href={hrefOf(n)}
                      onClick={() => setOpen(false)}
                      className={`flex items-start gap-3 px-4 py-3 hover:bg-yt-hover ${
                        n.read ? "" : "bg-yt-hover/40"
                      }`}
                    >
                      <img
                        src={n.actor?.image ?? ""}
                        alt=""
                        className="h-9 w-9 shrink-0 rounded-full bg-yt-hover"
                      />
                      <span className="min-w-0 flex-1 text-sm">
                        <span className="line-clamp-2">
                          {n.actor?.name && <span className="font-medium">{n.actor.name} </span>}
                          {t(LABEL_KEY[n.type] ?? "")}
                          {subject && <span className="text-yt-text2">: {subject}</span>}
                        </span>
                        <span className="mt-0.5 block text-xs text-yt-text2">
                          {fmt.ago(n.createdAt)}
                        </span>
                      </span>
                      {thumb && (
                        <img
                          src={thumb}
                          alt=""
                          className="h-10 w-16 shrink-0 rounded object-cover bg-yt-hover"
                        />
                      )}
                      {!n.read && (
                        <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-yt-cta" />
                      )}
                    </Link>
                  );
                })
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
