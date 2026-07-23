import * as schema from "@/db/schema";
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { nextCookies } from "better-auth/next-js";
import { admin, username } from "better-auth/plugins";
import { db } from "./db";
import { notifyAdmins } from "./notifications";
import { readSettingsNoStore } from "./settings";

type SocialProviders = {
  google?: { clientId: string; clientSecret: string };
  github?: { clientId: string; clientSecret: string };
};

const betterAuthBaseURL =
  process.env.BETTER_AUTH_URL?.replace(/\/$/, "") || "http://localhost:3000";
const trustedOrigins = Array.from(
  new Set([
    betterAuthBaseURL,
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "https://ardeanbimasaputra.com",
    "https://www.ardeanbimasaputra.com",
  ]),
);

function buildAuth(socialProviders: SocialProviders) {
  return betterAuth({
    baseURL: betterAuthBaseURL,
    trustedOrigins,
    advanced: {
      trustedProxyHeaders: true,
    },
    database: drizzleAdapter(db, { provider: "pg", schema }),
    emailAndPassword: { enabled: true },
    socialProviders,
    databaseHooks: {
      user: {
        create: {
          after: async (u: { id: string; name: string; username?: string | null }) => {
            await notifyAdmins({
              type: "NEW_USER",
              actorId: u.id,
              meta: { username: u.username ?? u.name },
            }).catch(() => {});
          },
        },
      },
    },
    user: {
      additionalFields: {
        bio: { type: "string", required: false },
        banner: { type: "string", required: false },
      },
    },
    plugins: [username(), admin({ defaultRole: "member", adminRoles: ["admin"] }), nextCookies()],
  });
}

type Auth = ReturnType<typeof buildAuth>;

const globalForAuth = globalThis as unknown as { authInstance?: Auth };

let instance: Auth = (globalForAuth.authInstance ??= buildAuth({}));

export async function rebuildAuthProviders(): Promise<void> {
  const s = await readSettingsNoStore();
  const providers: SocialProviders = {};
  const g = s.integrations.googleOauth;
  if (g.enabled && g.clientId && g.clientSecret) {
    providers.google = { clientId: g.clientId, clientSecret: g.clientSecret };
  }
  const gh = s.integrations.githubOauth;
  if (gh.enabled && gh.clientId && gh.clientSecret) {
    providers.github = { clientId: gh.clientId, clientSecret: gh.clientSecret };
  }
  instance = buildAuth(providers);
  globalForAuth.authInstance = instance;
}

void rebuildAuthProviders().catch(() => {});

export const auth: Auth = new Proxy({} as Auth, {
  get(_t, prop) {
    return instance[prop as keyof Auth];
  },
  has(_t, prop) {
    return prop in instance;
  },
  ownKeys() {
    return Reflect.ownKeys(instance);
  },
  getOwnPropertyDescriptor(_t, prop) {
    const desc = Reflect.getOwnPropertyDescriptor(instance, prop);
    return desc ? { ...desc, configurable: true } : undefined;
  },
});
