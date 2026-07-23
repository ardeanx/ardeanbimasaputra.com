import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "./auth";

export async function getSession() {
  return auth.api.getSession({ headers: await headers() });
}

export type Actor = { id: string; role: string | null };

export function actorOf(user: { id: string; role?: string | null }): Actor {
  return { id: user.id, role: user.role ?? null };
}

export async function requireSession() {
  const session = await getSession();
  if (!session) redirect("/login");
  return session;
}

export async function requireAdmin() {
  const session = await requireSession();
  const role = (session.user as { role?: string | null }).role ?? null;
  if (role !== "admin") redirect("/studio");
  return session;
}

export function isAdminUser(user: { role?: string | null }): boolean {
  return (user.role ?? null) === "admin";
}
