import { desc, eq, gt } from "drizzle-orm";
import SettingsModal from "@/components/studio/settings/SettingsModal";
import { session as sessionTable, user } from "@/db/schema";
import { db } from "@/lib/db";
import { getT, listLocales } from "@/lib/i18n";
import { requireAdmin } from "@/lib/session";
import { getSettings, maskSecrets } from "@/lib/settings";

export async function generateMetadata() {
  const t = await getT();
  return { title: t("meta.studioSettings") };
}

export default async function SettingsPage() {
  const session = await requireAdmin();
  const [settings, locales, rows] = await Promise.all([
    getSettings(),
    listLocales(),
    db
      .select({
        id: sessionTable.id,
        token: sessionTable.token,
        userAgent: sessionTable.userAgent,
        ipAddress: sessionTable.ipAddress,
        createdAt: sessionTable.createdAt,
        name: user.name,
      })
      .from(sessionTable)
      .innerJoin(user, eq(user.id, sessionTable.userId))
      .where(gt(sessionTable.expiresAt, new Date()))
      .orderBy(desc(sessionTable.createdAt)),
  ]);
  const sessions = rows.map((r) => ({
    id: r.id,
    name: r.name,
    userAgent: r.userAgent,
    ipAddress: r.ipAddress,
    createdAt: r.createdAt.toISOString(),
    current: r.token === session.session.token,
  }));
  return <SettingsModal settings={maskSecrets(settings)} locales={locales} sessions={sessions} />;
}
