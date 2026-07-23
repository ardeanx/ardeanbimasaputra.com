import postgres from "postgres";

const url = process.env.DATABASE_URL ?? "postgres://postgres@127.0.0.1:5432/ardean";
const sql = postgres(url, { max: 1 });

type Old = {
  general?: { siteName?: string; tagline?: string };
  system?: Record<string, unknown>;
  appearance?: { defaultTheme?: string; showChips?: boolean };
  seo?: {
    titleTemplate?: string;
    metaDescription?: string;
    allowIndexing?: boolean;
  };
  integrations?: { paymentsEnabled?: boolean };
  security?: { allowRegistration?: boolean; minPasswordLength?: number };
  notifications?: {
    fanoutNewContent?: boolean;
    notifyComments?: boolean;
    bellPollSec?: number;
  };
};

async function main() {
  const rows = await sql`select value from app_setting where id = 1`;
  const old = (rows[0]?.value ?? {}) as Old & {
    system?: { appName?: string };
  };
  if (old.system && "appName" in old.system) {
    console.log("sudah v2, lewati");
    await sql.end();
    return;
  }
  const next = {
    system: {
      ...old.system,
      appName: old.general?.siteName,
      allowRegistration: old.security?.allowRegistration,
      fanoutNewContent: old.notifications?.fanoutNewContent,
      notifyComments: old.notifications?.notifyComments,
      bellPollSec: old.notifications?.bellPollSec,
    },
    appearance: {
      defaultTheme: old.appearance?.defaultTheme,
      showChips: old.appearance?.showChips,
    },
    seo: {
      siteTitle: old.general?.siteName,
      siteDescription: old.seo?.metaDescription ?? old.general?.tagline,
      titleTemplate: old.seo?.titleTemplate,
      allowIndexing: old.seo?.allowIndexing,
    },
    integrations: {
      midtrans: {
        enabled: old.integrations?.paymentsEnabled ?? false,
        serverKey: process.env.MIDTRANS_SERVER_KEY ?? "",
        clientKey: process.env.NEXT_PUBLIC_MIDTRANS_CLIENT_KEY ?? "",
        production: process.env.MIDTRANS_IS_PRODUCTION === "true",
      },
    },
    security: {
      minPasswordLength: old.security?.minPasswordLength,
    },
  };
  const clean = JSON.parse(JSON.stringify(next, (_k, v) => (v === undefined ? undefined : v)));
  await sql`
    insert into app_setting (id, value, "updatedAt")
    values (1, ${sql.json(clean)}, now())
    on conflict (id) do update set value = ${sql.json(clean)}, "updatedAt" = now()
  `;
  console.log("migrate-v4 selesai: settings dipetakan ke struktur v2");
  await sql.end();
}

main().catch(async (e) => {
  console.error(e);
  await sql.end();
  process.exit(1);
});
