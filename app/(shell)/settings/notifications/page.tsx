import { redirect } from "next/navigation";
import NotifPrefsForm from "@/components/usersettings/NotifPrefsForm";
import { getNotifPrefs } from "@/lib/notification-prefs";
import { getSession } from "@/lib/session";

export const dynamic = "force-dynamic";

export default async function NotificationsSettingsPage() {
  const sess = await getSession();
  if (!sess) redirect("/?signin=1");
  const prefs = await getNotifPrefs(sess.user.id);
  return <NotifPrefsForm initial={prefs} />;
}
