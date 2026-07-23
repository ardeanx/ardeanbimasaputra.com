import EditorRoot from "@/components/studio/editor/EditorRoot";
import { category } from "@/db/schema";
import { db } from "@/lib/db";
import { DEFAULT_LOCALE, listLocales } from "@/lib/i18n";
import { getSession } from "@/lib/session";
import { getSettings } from "@/lib/settings";

export const dynamic = "force-dynamic";

const CREATE_TYPES = ["POST", "VIDEO", "AUDIO", "RESOURCE"] as const;

export default async function NewPost({
  searchParams,
}: {
  searchParams: Promise<{ type?: string }>;
}) {
  const session = await getSession();
  const [{ type: rawType }, cats, settings, locales] = await Promise.all([
    searchParams,
    db.select().from(category).orderBy(category.name),
    getSettings(),
    listLocales(),
  ]);
  const isAdmin = (session!.user as { role?: string | null }).role === "admin";
  const type = CREATE_TYPES.includes(rawType as (typeof CREATE_TYPES)[number])
    ? (rawType as (typeof CREATE_TYPES)[number])
    : settings.system.defaultPostFormat;

  return (
    <EditorRoot
      categories={cats}
      isAdmin={isAdmin}
      locales={locales}
      defaultLocale={DEFAULT_LOCALE}
      defaults={{
        status: "DRAFT",
        title: "",
        type,
        slug: "",
        categoryId: null,
        excerpt: null,
        thumbnail: null,
        visibility: "PUBLIC",
        mediaUrl: null,
        durationSec: null,
        repoUrl: null,
        seoTitle: null,
        seoDescription: null,
        ogImage: null,
        canonicalUrl: null,
        noindex: false,
        body: "",
      }}
    />
  );
}
