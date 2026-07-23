"use client";

import { saveSettingsAction } from "@/app/(studio)/studio/settings/actions";
import { useT } from "@/components/i18n/I18nProvider";
import type { AppSettings } from "@/lib/settings";
import { useState } from "react";
import { toast } from "sonner";
import {
  DialogButton,
  Field,
  KEEP_SENTINEL,
  MiniDialog,
  NumberField,
  Row,
  SecretField,
  TextArea,
  TextField,
  Toggle,
} from "./forms";

type Integrations = AppSettings["integrations"];
type IntKey = keyof Integrations;
type Draft = Record<string, string | number | boolean>;

type FieldSpec = {
  key: string;
  label?: string;
  labelKey?: string;
  kind: "text" | "secret" | "textarea" | "toggle" | "number";
  placeholder?: string;
  hintKey?: string;
  min?: number;
  max?: number;
};

type Card = {
  id: IntKey;
  name: string;
  descKey: string;
  hintKey?: string;
  fields: FieldSpec[];
};

const CARDS: Card[] = [
  {
    id: "midtrans",
    name: "Midtrans",
    descKey: "settings.integrations.midtrans.desc",
    fields: [
      { key: "serverKey", label: "Server Key", kind: "secret" },
      { key: "clientKey", label: "Client Key", kind: "text" },
      {
        key: "production",
        labelKey: "settings.integrations.productionMode",
        kind: "toggle",
        hintKey: "settings.integrations.productionModeHint",
      },
    ],
  },
  {
    id: "push",
    name: "Push Notification",
    descKey: "settings.integrations.push.desc",
    fields: [
      { key: "vapidPublicKey", label: "VAPID Public Key", kind: "text" },
      { key: "vapidPrivateKey", label: "VAPID Private Key", kind: "secret" },
      {
        key: "subject",
        label: "Subject",
        kind: "text",
        placeholder: "mailto:admin@situsanda.com",
      },
    ],
  },
  {
    id: "brevo",
    name: "Brevo",
    descKey: "settings.integrations.brevo.desc",
    fields: [
      { key: "apiKey", label: "API Key", kind: "secret" },
      { key: "fromEmail", labelKey: "settings.integrations.fromEmail", kind: "text" },
      { key: "fromName", labelKey: "settings.integrations.fromName", kind: "text" },
    ],
  },
  {
    id: "googleOauth",
    name: "Google (OAuth)",
    descKey: "settings.integrations.googleOauth.desc",
    hintKey: "settings.integrations.restartHint",
    fields: [
      {
        key: "enabled",
        labelKey: "settings.integrations.enabled",
        kind: "toggle",
        hintKey: "settings.integrations.enabledHint",
      },
      { key: "clientId", label: "Client ID", kind: "text" },
      { key: "clientSecret", label: "Client Secret", kind: "secret" },
    ],
  },
  {
    id: "githubOauth",
    name: "GitHub (OAuth)",
    descKey: "settings.integrations.githubOauth.desc",
    hintKey: "settings.integrations.restartHint",
    fields: [
      {
        key: "enabled",
        labelKey: "settings.integrations.enabled",
        kind: "toggle",
        hintKey: "settings.integrations.enabledHint",
      },
      { key: "clientId", label: "Client ID", kind: "text" },
      { key: "clientSecret", label: "Client Secret", kind: "secret" },
    ],
  },
  {
    id: "turnstile",
    name: "Turnstile",
    descKey: "settings.integrations.turnstile.desc",
    fields: [
      { key: "siteKey", label: "Site Key", kind: "text" },
      { key: "secretKey", label: "Secret Key", kind: "secret" },
    ],
  },
  {
    id: "bankTransfer",
    name: "Bank Transfer",
    descKey: "settings.integrations.bankTransfer.desc",
    fields: [
      { key: "bankName", labelKey: "settings.integrations.bankName", kind: "text" },
      { key: "accountNumber", labelKey: "settings.integrations.accountNumber", kind: "text" },
      { key: "accountName", labelKey: "settings.integrations.accountName", kind: "text" },
      { key: "instructions", labelKey: "settings.integrations.instructions", kind: "textarea" },
    ],
  },
  {
    id: "googleTranslate",
    name: "Google Translate",
    descKey: "settings.integrations.autoTranslateDesc",
    fields: [{ key: "apiKey", label: "API Key", kind: "secret" }],
  },
  {
    id: "deepl",
    name: "DeepL",
    descKey: "settings.integrations.autoTranslateDesc",
    fields: [{ key: "apiKey", label: "API Key", kind: "secret" }],
  },
  {
    id: "giphy",
    name: "Giphy",
    descKey: "settings.integrations.giphy.desc",
    fields: [{ key: "apiKey", label: "API Key", kind: "secret" }],
  },
  {
    id: "ads",
    name: "Ads",
    descKey: "settings.integrations.ads.desc",
    fields: [
      { key: "code", labelKey: "settings.integrations.adCode", kind: "textarea" },
      { key: "posTop", labelKey: "settings.integrations.posTop", kind: "toggle" },
      { key: "posMiddle", labelKey: "settings.integrations.posMiddle", kind: "toggle" },
      { key: "posBottom", labelKey: "settings.integrations.posBottom", kind: "toggle" },
    ],
  },
  {
    id: "vast",
    name: "VAST Ads",
    descKey: "settings.integrations.vast.desc",
    fields: [
      { key: "tagUrl", label: "Tag URL", kind: "text" },
      {
        key: "skipAfterSec",
        labelKey: "settings.integrations.skipAfter",
        kind: "number",
        min: 0,
        max: 60,
      },
      {
        key: "timeoutSec",
        labelKey: "settings.integrations.timeout",
        kind: "number",
        min: 1,
        max: 30,
      },
    ],
  },
];

function maskDraft(card: Card, draft: Draft): Draft {
  const out = { ...draft };
  for (const f of card.fields) {
    if (f.kind === "secret" && out[f.key]) out[f.key] = KEEP_SENTINEL;
  }
  return out;
}

function SetupDialog({
  card,
  initial,
  onSaved,
  onClose,
}: {
  card: Card;
  initial: Draft;
  onSaved: (draft: Draft) => void;
  onClose: () => void;
}) {
  const t = useT();
  const [draft, setDraft] = useState<Draft>(initial);
  const [saving, setSaving] = useState(false);

  function set(key: string, v: string | number | boolean) {
    setDraft((p) => ({ ...p, [key]: v }));
  }

  function fieldLabel(f: FieldSpec) {
    return f.labelKey ? t(f.labelKey) : (f.label ?? "");
  }

  async function save() {
    setSaving(true);
    const res = await saveSettingsAction({ integrations: { [card.id]: draft } });
    setSaving(false);
    if ("error" in res) {
      toast.error(res.error);
      return;
    }
    toast.success(t("settings.integrations.saved", { name: card.name }));
    onSaved(maskDraft(card, draft));
    onClose();
  }

  return (
    <MiniDialog
      title={t("settings.integrations.setupTitle", { name: card.name })}
      onClose={onClose}
      footer={
        <>
          <DialogButton onClick={onClose}>{t("common.cancel")}</DialogButton>
          <DialogButton primary disabled={saving} onClick={save}>
            {saving ? t("common.saving") : t("settings.save")}
          </DialogButton>
        </>
      }
    >
      {card.hintKey && <p className="mb-1 text-xs text-yt-text2">{t(card.hintKey)}</p>}
      <Row label={t("settings.integrations.enable")} hint={t(card.descKey)}>
        <Toggle
          ariaLabel={t("settings.integrations.enableAria", { name: card.name })}
          checked={Boolean(draft.enabled)}
          onChange={(v) => set("enabled", v)}
        />
      </Row>
      {card.fields.map((f) => {
        const label = fieldLabel(f);
        const hint = f.hintKey ? t(f.hintKey) : undefined;
        if (f.kind === "toggle")
          return (
            <Row key={f.key} label={label} hint={hint}>
              <Toggle
                ariaLabel={label}
                checked={Boolean(draft[f.key])}
                onChange={(v) => set(f.key, v)}
              />
            </Row>
          );
        if (f.kind === "number")
          return (
            <Row key={f.key} label={label} hint={hint}>
              <NumberField
                ariaLabel={label}
                value={Number(draft[f.key] ?? 0)}
                min={f.min}
                max={f.max}
                onChange={(v) => set(f.key, v)}
              />
            </Row>
          );
        if (f.kind === "textarea")
          return (
            <Field key={f.key} label={label} hint={hint}>
              <TextArea
                value={String(draft[f.key] ?? "")}
                onChange={(v) => set(f.key, v)}
                placeholder={f.placeholder}
              />
            </Field>
          );
        if (f.kind === "secret")
          return (
            <Field key={f.key} label={label} hint={hint}>
              <SecretField
                ariaLabel={label}
                value={String(draft[f.key] ?? "")}
                onChange={(v) => set(f.key, v)}
              />
            </Field>
          );
        return (
          <Field key={f.key} label={label} hint={hint}>
            <TextField
              value={String(draft[f.key] ?? "")}
              onChange={(v) => set(f.key, v)}
              placeholder={f.placeholder}
            />
          </Field>
        );
      })}
    </MiniDialog>
  );
}

export default function IntegrationsSection({ integrations }: { integrations: Integrations }) {
  const t = useT();
  const [ints, setInts] = useState(integrations);
  const [openId, setOpenId] = useState<IntKey | null>(null);
  const openCard = CARDS.find((c) => c.id === openId);

  return (
    <>
      <div className="min-h-0 flex-1 overflow-y-auto px-8 py-5">
        <p className="mb-4 text-sm text-yt-text2">{t("settings.integrations.intro")}</p>
        <div className="grid grid-cols-2 gap-4">
          {CARDS.map((c) => {
            const enabled = Boolean((ints[c.id] as { enabled: boolean }).enabled);
            return (
              <div
                key={c.id}
                className="flex flex-col rounded-xl border border-yt-outline p-4 transition-colors hover:bg-yt-hover/50"
              >
                <div className="flex items-start justify-between gap-3">
                  <p className="text-sm font-medium">{c.name}</p>
                  <span
                    className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${
                      enabled
                        ? "bg-green-500/15 text-green-600 dark:text-green-400"
                        : "bg-yt-chip text-yt-text2"
                    }`}
                  >
                    {enabled
                      ? t("settings.integrations.active")
                      : t("settings.integrations.inactive")}
                  </span>
                </div>
                <p className="mt-1 flex-1 text-sm text-yt-text2">{t(c.descKey)}</p>
                <div className="mt-3">
                  <button
                    type="button"
                    onClick={() => setOpenId(c.id)}
                    className="h-8 rounded-full border border-yt-outline px-4 text-sm font-medium transition hover:bg-yt-hover"
                  >
                    {t("settings.integrations.setup")}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
      {openCard && (
        <SetupDialog
          card={openCard}
          initial={{ ...(ints[openCard.id] as Draft) }}
          onSaved={(draft) => setInts((p) => ({ ...p, [openCard.id]: draft }) as Integrations)}
          onClose={() => setOpenId(null)}
        />
      )}
    </>
  );
}
