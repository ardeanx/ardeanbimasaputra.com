"use client";

import {
  AtSign,
  Briefcase,
  Camera,
  MessageCircle,
  Music2,
  Play,
  Send,
  ThumbsUp,
} from "lucide-react";
import { forwardRef, useImperativeHandle, useState } from "react";
import { toast } from "sonner";
import { saveSettingsAction } from "@/app/(studio)/studio/settings/actions";
import { useT } from "@/components/i18n/I18nProvider";
import type { AppSettings } from "@/lib/settings";
import Select from "@/components/ui/Select";
import DropzoneField from "./DropzoneField";
import {
  Field,
  GroupTitle,
  Row,
  type SaveHandle,
  TextArea,
  TextField,
  Toggle,
  inputCls,
} from "./forms";

type Seo = AppSettings["seo"];

const SOCIALS: {
  key: keyof Seo["socials"];
  label: string;
  icon: React.ComponentType<{ size?: number | string; className?: string }>;
}[] = [
  { key: "youtube", label: "YouTube", icon: Play },
  { key: "instagram", label: "Instagram", icon: Camera },
  { key: "tiktok", label: "TikTok", icon: Music2 },
  { key: "facebook", label: "Facebook", icon: ThumbsUp },
  { key: "reddit", label: "Reddit", icon: MessageCircle },
  { key: "x", label: "X (Twitter)", icon: AtSign },
  { key: "telegram", label: "Telegram", icon: Send },
  { key: "linkedin", label: "LinkedIn", icon: Briefcase },
];

const LOCAL_FIELDS: { key: keyof Seo["localSeo"]; labelKey: string }[] = [
  { key: "websiteName", labelKey: "settings.seo.local.websiteName" },
  { key: "alternateName", labelKey: "settings.seo.local.alternateName" },
  { key: "entityName", labelKey: "settings.seo.local.entityName" },
  { key: "url", labelKey: "settings.seo.local.url" },
  { key: "email", labelKey: "settings.email" },
  { key: "phone", labelKey: "settings.seo.local.phone" },
  { key: "address", labelKey: "settings.seo.local.address" },
  { key: "city", labelKey: "settings.seo.local.city" },
  { key: "region", labelKey: "settings.seo.local.region" },
  { key: "country", labelKey: "settings.seo.local.country" },
  { key: "zip", labelKey: "settings.seo.local.zip" },
  { key: "aboutUrl", labelKey: "settings.seo.local.aboutUrl" },
  { key: "contactUrl", labelKey: "settings.seo.local.contactUrl" },
];

const SeoSection = forwardRef<SaveHandle, { seo: Seo }>(function SeoSection({ seo }, ref) {
  const t = useT();
  const [s, setS] = useState(seo);

  function patch<K extends keyof Seo>(k: K, v: Seo[K]) {
    setS((p) => ({ ...p, [k]: v }));
  }
  function patchLocal<K extends keyof Seo["localSeo"]>(k: K, v: Seo["localSeo"][K]) {
    setS((p) => ({ ...p, localSeo: { ...p.localSeo, [k]: v } }));
  }
  function patchSocial(k: keyof Seo["socials"], v: string) {
    setS((p) => ({ ...p, socials: { ...p.socials, [k]: v } }));
  }

  async function save() {
    const res = await saveSettingsAction({ seo: s });
    if ("error" in res) {
      toast.error(res.error);
      return false;
    }
    return true;
  }
  useImperativeHandle(ref, () => ({ save }));

  return (
    <>
      <div className="min-h-0 flex-1 overflow-y-auto px-8 py-5">
        <Field label={t("settings.seo.siteTitle")}>
          <TextField value={s.siteTitle} onChange={(v) => patch("siteTitle", v)} />
        </Field>
        <Field label={t("settings.seo.siteDescription")}>
          <TextArea
            value={s.siteDescription}
            onChange={(v) => patch("siteDescription", v)}
            maxLength={300}
          />
        </Field>
        <Field label={t("settings.seo.titleTemplate")} hint={t("settings.seo.titleTemplateHint")}>
          <TextField value={s.titleTemplate} onChange={(v) => patch("titleTemplate", v)} />
        </Field>
        <DropzoneField
          label={t("settings.seo.ogImage")}
          value={s.ogImage}
          onChange={(v) => patch("ogImage", v)}
          hint={t("settings.seo.ogImageHint")}
          crop={false}
        />
        <Row label={t("settings.seo.schema")} hint={t("settings.seo.schemaHint")}>
          <Select
            ariaLabel={t("settings.seo.schema")}
            className="w-44"
            value={s.schemaType}
            onChange={(v) => patch("schemaType", v as Seo["schemaType"])}
            options={["WebSite", "Organization", "Person", "Blog"].map((t) => ({
              value: t,
              label: t,
            }))}
          />
        </Row>
        <Row label={t("settings.seo.allowIndexing")} hint={t("settings.seo.allowIndexingHint")}>
          <Toggle
            ariaLabel={t("settings.seo.allowIndexing")}
            checked={s.allowIndexing}
            onChange={(v) => patch("allowIndexing", v)}
          />
        </Row>
        <Row label={t("settings.seo.nofollowExternal")}>
          <Toggle
            ariaLabel={t("settings.seo.nofollowExternal")}
            checked={s.nofollowExternal}
            onChange={(v) => patch("nofollowExternal", v)}
          />
        </Row>
        <Row label={t("settings.seo.nofollowImages")}>
          <Toggle
            ariaLabel={t("settings.seo.nofollowImages")}
            checked={s.nofollowImageLinks}
            onChange={(v) => patch("nofollowImageLinks", v)}
          />
        </Row>
        <Row label={t("settings.seo.externalNewTab")}>
          <Toggle
            ariaLabel={t("settings.seo.externalNewTab")}
            checked={s.externalNewTab}
            onChange={(v) => patch("externalNewTab", v)}
          />
        </Row>
        <Row label={t("settings.seo.autoLlmTxt")} hint={t("settings.seo.autoLlmTxtHint")}>
          <Toggle
            ariaLabel={t("settings.seo.autoLlmTxt")}
            checked={s.autoLlmTxt}
            onChange={(v) => patch("autoLlmTxt", v)}
          />
        </Row>
        <Row label={t("settings.seo.rssFeed")} hint={t("settings.seo.rssFeedHint")}>
          <Toggle
            ariaLabel={t("settings.seo.rssFeed")}
            checked={s.rssFeed}
            onChange={(v) => patch("rssFeed", v)}
          />
        </Row>
        <Row label={t("settings.seo.autoCapitalize")}>
          <Toggle
            ariaLabel={t("settings.seo.autoCapitalize")}
            checked={s.autoCapitalizeTitle}
            onChange={(v) => patch("autoCapitalizeTitle", v)}
          />
        </Row>

        <GroupTitle>{t("settings.seo.localSeo")}</GroupTitle>
        <div className="grid grid-cols-2 gap-x-4">
          <Field label={t("settings.seo.entityType")}>
            <Select
              ariaLabel={t("settings.seo.entityType")}
              value={s.localSeo.entityType}
              onChange={(v) => patchLocal("entityType", v as Seo["localSeo"]["entityType"])}
              options={[
                { value: "Person", label: "Person" },
                { value: "Organization", label: "Organization" },
              ]}
            />
          </Field>
          {LOCAL_FIELDS.map((f) => (
            <Field key={f.key} label={t(f.labelKey)}>
              <TextField
                value={s.localSeo[f.key] as string}
                onChange={(v) => patchLocal(f.key, v)}
              />
            </Field>
          ))}
          <div className="col-span-2">
            <DropzoneField
              label={t("settings.seo.entityLogo")}
              value={s.localSeo.logo}
              onChange={(v) => patchLocal("logo", v)}
              crop={false}
            />
          </div>
        </div>

        <GroupTitle>{t("settings.seo.socialMedia")}</GroupTitle>
        <div className="grid grid-cols-2 gap-x-4">
          {SOCIALS.map((soc) => (
            <Field key={soc.key} label={soc.label}>
              <div className="relative">
                <soc.icon
                  size={16}
                  className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-yt-text2"
                />
                <input
                  value={s.socials[soc.key]}
                  aria-label={t("settings.seo.socialUrl", { label: soc.label })}
                  onChange={(e) => patchSocial(soc.key, e.target.value)}
                  placeholder={`https://…`}
                  className={`${inputCls} pl-9`}
                />
              </div>
            </Field>
          ))}
        </div>
      </div>
    </>
  );
});

export default SeoSection;
