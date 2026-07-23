import { toNextJsHandler } from "better-auth/next-js";
import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { user } from "@/db/schema";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { getT } from "@/lib/i18n";
import { cacheGet, redis } from "@/lib/redis";
import { getSettings } from "@/lib/settings";

const handler = toNextJsHandler(auth);

export const GET = handler.GET;

function clientIp(req: Request): string {
  return req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "local";
}

async function verifyTurnstile(
  token: string | undefined,
  secretKey: string,
  ip: string,
): Promise<boolean> {
  if (!token) return false;
  try {
    const res = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ secret: secretKey, response: token, remoteip: ip }),
    });
    const data = (await res.json()) as { success?: boolean };
    return data.success === true;
  } catch {
    return false;
  }
}

export async function POST(req: Request) {
  const url = new URL(req.url);
  const s = await getSettings();
  const t = await getT();
  const ip = clientIp(req);

  if (url.pathname.includes("/sign-up")) {
    if (!s.system.allowRegistration) {
      return NextResponse.json({ message: t("authErr.registrationClosed") }, { status: 403 });
    }
    const body = (await req
      .clone()
      .json()
      .catch(() => null)) as {
      password?: string;
      turnstileToken?: string;
    } | null;
    if (body?.password && body.password.length < s.security.minPasswordLength) {
      return NextResponse.json(
        {
          message: t("authErr.passwordMin", { n: s.security.minPasswordLength }),
        },
        { status: 400 },
      );
    }
    if (s.integrations.turnstile.enabled) {
      const ok = await verifyTurnstile(
        body?.turnstileToken,
        s.integrations.turnstile.secretKey,
        ip,
      );
      if (!ok) {
        return NextResponse.json({ message: t("authErr.turnstile") }, { status: 403 });
      }
    }
  }

  if (url.pathname.includes("/sign-in")) {
    const body = (await req
      .clone()
      .json()
      .catch(() => null)) as {
      email?: string;
      turnstileToken?: string;
    } | null;
    const email = (body?.email ?? "").toLowerCase();
    const who = email || ip;
    const key = `login-fail:${who}`;
    let isAdmin = false;
    if (email) {
      const u = await db.query.user.findFirst({
        where: eq(user.email, email),
        columns: { role: true },
      });
      isAdmin = u?.role === "admin";
    }
    const fails = Number((await cacheGet(key)) ?? 0);
    if (!isAdmin && fails >= s.security.maxLoginAttempts) {
      return NextResponse.json(
        {
          message: t("authErr.lockout", { n: s.security.lockoutMinutes }),
        },
        { status: 429 },
      );
    }
    if (s.integrations.turnstile.enabled) {
      const ok = await verifyTurnstile(
        body?.turnstileToken,
        s.integrations.turnstile.secretKey,
        ip,
      );
      if (!ok) {
        return NextResponse.json({ message: t("authErr.turnstile") }, { status: 403 });
      }
    }
    const res = await handler.POST(req);
    try {
      if (res.status >= 400 && !isAdmin) {
        await redis
          .multi()
          .incr(key)
          .expire(key, s.security.lockoutMinutes * 60)
          .exec();
      } else {
        await redis.del(key);
      }
    } catch {}
    return res;
  }

  return handler.POST(req);
}
