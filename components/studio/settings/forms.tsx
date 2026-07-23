"use client";

import { useT } from "@/components/i18n/I18nProvider";

export const KEEP_SENTINEL = "__KEEP__";

export type SaveHandle = { save: () => Promise<boolean> };

export function GroupTitle({ children }: { children: React.ReactNode }) {
  return (
    <h3 className="mt-8 mb-1 text-xs font-semibold tracking-wide text-yt-text2 uppercase">
      {children}
    </h3>
  );
}

export function Row({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between gap-6 border-b border-yt-outline/60 py-3.5 last:border-b-0">
      <div className="min-w-0">
        <p className="text-sm font-medium">{label}</p>
        {hint && <p className="mt-0.5 text-xs text-yt-text2">{hint}</p>}
      </div>
      <div className="shrink-0">{children}</div>
    </div>
  );
}

export function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="py-3">
      <p className="mb-1.5 text-sm font-medium">{label}</p>
      {children}
      {hint && <p className="mt-1 text-xs text-yt-text2">{hint}</p>}
    </div>
  );
}

export const inputCls =
  "h-10 w-full rounded-lg border border-yt-outline bg-transparent px-3 text-sm outline-none transition-colors focus:border-yt-cta";

export function TextField({
  value,
  onChange,
  placeholder,
  className = "",
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  className?: string;
}) {
  return (
    <input
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className={`${inputCls} ${className}`}
    />
  );
}

export function NumberField({
  value,
  onChange,
  min,
  max,
  ariaLabel,
}: {
  value: number;
  onChange: (v: number) => void;
  min?: number;
  max?: number;
  ariaLabel: string;
}) {
  return (
    <input
      type="number"
      aria-label={ariaLabel}
      value={value}
      min={min}
      max={max}
      onChange={(e) => onChange(Number(e.target.value))}
      className="h-10 w-28 rounded-lg border border-yt-outline bg-transparent px-3 text-sm outline-none transition-colors focus:border-yt-cta"
    />
  );
}

export function TextArea({
  value,
  onChange,
  placeholder,
  maxLength,
  rows = 3,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  maxLength?: number;
  rows?: number;
}) {
  return (
    <div>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        maxLength={maxLength}
        rows={rows}
        className="w-full resize-y rounded-lg border border-yt-outline bg-transparent px-3 py-2 text-sm outline-none transition-colors focus:border-yt-cta"
      />
      {maxLength !== undefined && (
        <p className="mt-0.5 text-right text-xs text-yt-text2">
          {value.length}/{maxLength}
        </p>
      )}
    </div>
  );
}

export function Toggle({
  checked,
  onChange,
  ariaLabel,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  ariaLabel: string;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={ariaLabel}
      onClick={() => onChange(!checked)}
      className={`relative h-6 w-11 shrink-0 rounded-full transition-colors ${
        checked ? "bg-yt-cta" : "bg-black/20 dark:bg-white/25"
      }`}
    >
      <span
        className={`absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white shadow ring-1 ring-black/10 transition-transform ${
          checked ? "translate-x-5" : ""
        }`}
      />
    </button>
  );
}

export function SecretField({
  value,
  onChange,
  ariaLabel,
}: {
  value: string;
  onChange: (v: string) => void;
  ariaLabel: string;
}) {
  const t = useT();
  if (value === KEEP_SENTINEL) {
    return (
      <div className="flex items-center gap-2">
        <input
          readOnly
          aria-label={ariaLabel}
          placeholder={t("settings.secretStored")}
          className="h-10 w-full rounded-lg border border-yt-outline bg-yt-hover px-3 text-sm text-yt-text2 outline-none"
        />
        <button
          type="button"
          onClick={() => onChange("")}
          className="h-9 shrink-0 rounded-full border border-yt-outline px-4 text-sm font-medium hover:bg-yt-hover"
        >
          {t("settings.change")}
        </button>
      </div>
    );
  }
  return (
    <input
      value={value}
      aria-label={ariaLabel}
      onChange={(e) => onChange(e.target.value)}
      autoComplete="off"
      spellCheck={false}
      className={`${inputCls} font-mono`}
    />
  );
}

export function MiniDialog({
  title,
  children,
  onClose,
  footer,
}: {
  title: string;
  children: React.ReactNode;
  onClose: () => void;
  footer: React.ReactNode;
}) {
  const t = useT();
  return (
    <div className="fixed inset-0 z-[120] grid place-items-center p-4">
      <button
        type="button"
        aria-label={t("common.closeDialog")}
        onClick={onClose}
        className="absolute inset-0 cursor-default bg-black/60"
      />
      <div className="relative max-h-[85vh] w-full max-w-md overflow-y-auto rounded-2xl bg-yt-menu p-5 shadow-[0_8px_48px_rgba(0,0,0,0.4)]">
        <h3 className="text-base font-semibold">{title}</h3>
        <div className="mt-3">{children}</div>
        <div className="mt-5 flex justify-end gap-2">{footer}</div>
      </div>
    </div>
  );
}

export function DialogButton({
  onClick,
  primary,
  disabled,
  children,
}: {
  onClick: () => void;
  primary?: boolean;
  disabled?: boolean;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`h-9 rounded-full px-4 text-sm font-medium transition disabled:opacity-50 ${
        primary ? "bg-yt-cta text-white hover:brightness-110" : "hover:bg-yt-hover"
      }`}
    >
      {children}
    </button>
  );
}
