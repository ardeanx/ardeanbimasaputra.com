"use server";

import { and, eq, ne } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { cookies, headers } from "next/headers";
import { session as sessionTable, user as userTable } from "@/db/schema";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { type NotifPrefs, saveNotifPrefs } from "@/lib/notification-prefs";
import { getSession } from "@/lib/session";

type Result = { ok: true } | { error: string };

export async function changePasswordAction(input: {
  currentPassword: string;
  newPassword: string;
}): Promise<Result> {
  const session = await getSession();
  if (!session) return { error: "Harus masuk." };
  if (input.newPassword.length < 8) return { error: "Password baru minimal 8 karakter." };
  try {
    await auth.api.changePassword({
      body: {
        currentPassword: input.currentPassword,
        newPassword: input.newPassword,
        revokeOtherSessions: true,
      },
      headers: await headers(),
    });
    return { ok: true };
  } catch (e) {
    const msg = e instanceof Error ? e.message : "";
    if (/invalid password|incorrect/i.test(msg)) return { error: "Password lama salah." };
    if (/too short|at least/i.test(msg)) return { error: "Password baru terlalu pendek." };
    return { error: "Gagal mengganti password." };
  }
}

export async function signOutOtherSessionsAction(): Promise<Result> {
  const session = await getSession();
  if (!session) return { error: "Harus masuk." };
  await db
    .delete(sessionTable)
    .where(
      and(eq(sessionTable.userId, session.user.id), ne(sessionTable.token, session.session.token)),
    );
  revalidatePath("/settings/account");
  return { ok: true };
}

export async function updateProfileAction(input: {
  name: string;
  username: string;
  bio: string;
  image: string | null;
  banner: string | null;
}): Promise<Result> {
  const session = await getSession();
  if (!session) return { error: "Harus masuk." };
  const name = input.name.trim();
  if (!name) return { error: "Nama wajib diisi." };
  const display = input.username.trim();
  const uname = display.toLowerCase();
  if (!/^[a-z0-9_.]{3,30}$/.test(uname))
    return {
      error: "Username 3-30 karakter: huruf, angka, titik, atau garis bawah.",
    };
  const taken = await db.query.user.findFirst({
    where: (t, { and: andW, eq: eqW, ne: neW }) =>
      andW(eqW(t.username, uname), neW(t.id, session.user.id)),
  });
  if (taken) return { error: "Username sudah dipakai." };
  try {
    await db
      .update(userTable)
      .set({
        name,
        username: uname,
        displayUsername: display,
        bio: input.bio.trim() || null,
        image: input.image,
        banner: input.banner,
        updatedAt: new Date(),
      })
      .where(eq(userTable.id, session.user.id));
  } catch {
    return { error: "Username sudah dipakai." };
  }
  revalidatePath("/settings/profile");
  revalidatePath(`/@${uname}`);
  return { ok: true };
}

export async function saveNotifPrefsAction(prefs: NotifPrefs): Promise<Result> {
  const session = await getSession();
  if (!session) return { error: "Harus masuk." };
  await saveNotifPrefs(session.user.id, {
    comments: !!prefs.comments,
    replies: !!prefs.replies,
    follows: !!prefs.follows,
    newContent: !!prefs.newContent,
  });
  return { ok: true };
}

export async function setLangAction(lang: string): Promise<Result> {
  const session = await getSession();
  if (!session) return { error: "Harus masuk." };
  if (lang !== "id" && lang !== "en") return { error: "Bahasa tidak dikenal." };
  const store = await cookies();
  store.set("lang", lang, {
    httpOnly: false,
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
  });
  return { ok: true };
}
