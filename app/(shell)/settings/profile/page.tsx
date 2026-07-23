import { redirect } from "next/navigation";
import ProfileForm from "@/components/usersettings/ProfileForm";
import { db } from "@/lib/db";
import { getSession } from "@/lib/session";

export const dynamic = "force-dynamic";

export default async function ProfileSettingsPage() {
  const sess = await getSession();
  if (!sess) redirect("/?signin=1");
  const u = await db.query.user.findFirst({
    where: (t, { eq }) => eq(t.id, sess.user.id),
  });
  if (!u) redirect("/?signin=1");

  return (
    <ProfileForm
      initial={{
        name: u.name,
        username: u.displayUsername ?? u.username ?? "",
        bio: u.bio ?? "",
        image: u.image,
        banner: u.banner,
      }}
    />
  );
}
