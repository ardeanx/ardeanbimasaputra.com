import { count, desc } from "drizzle-orm";
import UsersTable, { type UserRow } from "@/components/studio/admin/UsersTable";
import VerificationTable, {
  type VerificationRow,
} from "@/components/studio/admin/VerificationTable";
import StudioTabs from "@/components/studio/StudioTabs";
import { post, user } from "@/db/schema";
import { db } from "@/lib/db";
import { getT } from "@/lib/i18n";
import { requireAdmin } from "@/lib/session";
import { listVerificationRequests } from "@/lib/verification";

export const dynamic = "force-dynamic";

export default async function StudioUsers({
  searchParams,
}: {
  searchParams: Promise<{ view?: string }>;
}) {
  const session = await requireAdmin();
  const { view } = await searchParams;
  const active = view === "verification" ? "verification" : "list";
  const t = await getT();
  const tabs = [
    { key: "list", label: t("studio.users.tabList") },
    { key: "verification", label: t("studio.users.tabVerification") },
  ];

  return (
    <div className="mx-auto max-w-6xl">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold">{t("studio.users.title")}</h1>
        <p className="mt-0.5 text-sm text-yt-text2">{t("studio.users.subtitle")}</p>
      </div>

      <StudioTabs tabs={tabs} param="view" />

      {active === "verification" ? (
        <VerificationPanel />
      ) : (
        <UsersPanel currentUserId={session.user.id} />
      )}
    </div>
  );
}

async function UsersPanel({ currentUserId }: { currentUserId: string }) {
  const rows = await db
    .select({
      id: user.id,
      name: user.name,
      username: user.username,
      email: user.email,
      image: user.image,
      role: user.role,
      banned: user.banned,
      banReason: user.banReason,
      createdAt: user.createdAt,
    })
    .from(user)
    .orderBy(desc(user.createdAt));

  const postCounts = await db
    .select({ authorId: post.authorId, n: count() })
    .from(post)
    .groupBy(post.authorId);
  const countMap = new Map(postCounts.map((c) => [c.authorId, Number(c.n)]));

  const data: UserRow[] = rows.map((r) => ({
    id: r.id,
    name: r.name,
    username: r.username,
    email: r.email,
    image: r.image,
    role: r.role,
    banned: r.banned ?? false,
    banReason: r.banReason,
    createdAt: r.createdAt.toISOString(),
    postCount: countMap.get(r.id) ?? 0,
  }));

  const adminCount = rows.filter((r) => r.role === "admin").length;

  return <UsersTable data={data} adminCount={adminCount} currentUserId={currentUserId} />;
}

async function VerificationPanel() {
  const t = await getT();
  const rows = await listVerificationRequests();

  const data: VerificationRow[] = rows.map((r) => ({
    id: r.id,
    status: r.status,
    message: r.message,
    links: r.links,
    createdAt: r.createdAt.toISOString(),
    requesterId: r.requesterId,
    name: r.name,
    username: r.username,
    image: r.image,
  }));

  return (
    <div className="max-w-3xl">
      <p className="mb-6 -mt-2 text-sm text-yt-text2">{t("studio.verification.subtitle")}</p>
      <VerificationTable data={data} />
    </div>
  );
}
