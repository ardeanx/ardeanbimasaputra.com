import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import PreferencesForm from "@/components/usersettings/PreferencesForm";
import { getSession } from "@/lib/session";
import { getSettings } from "@/lib/settings";

export const dynamic = "force-dynamic";

export default async function PreferencesSettingsPage() {
  const sess = await getSession();
  if (!sess) redirect("/?signin=1");
  const lang = (await cookies()).get("lang")?.value === "en" ? "en" : "id";
  const push = (await getSettings()).integrations.push;
  const vapidPublicKey =
    push.enabled && push.vapidPublicKey && push.vapidPrivateKey ? push.vapidPublicKey : "";
  return <PreferencesForm initialLang={lang} vapidPublicKey={vapidPublicKey} />;
}
