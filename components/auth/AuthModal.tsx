"use client";

import { X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { createPortal } from "react-dom";
import { Turnstile, turnstileToken } from "@/app/(auth)/Turnstile";
import { useT } from "@/components/i18n/I18nProvider";
import { Logo } from "@/components/shell/icons";
import { authClient } from "@/lib/auth-client";
import {
  type AuthMode,
  closeAuthModal,
  getAuthModalServerState,
  getAuthModalState,
  setAuthMode,
  subscribeAuthModal,
} from "./authModalStore";

const inputCls =
  "h-11 w-full rounded-lg border border-yt-searchborder bg-transparent px-3.5 text-sm outline-none focus:border-yt-cta";

function GoogleGlyph() {
  return (
    <svg viewBox="0 0 24 24" width={18} height={18} aria-hidden>
      <path
        fill="#4285F4"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.76h3.56c2.08-1.92 3.28-4.74 3.28-8.09Z"
      />
      <path
        fill="#34A853"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.56-2.76c-.98.66-2.24 1.06-3.72 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84A11 11 0 0 0 12 23Z"
      />
      <path
        fill="#FBBC05"
        d="M5.84 14.1a6.6 6.6 0 0 1 0-4.2V7.06H2.18a11 11 0 0 0 0 9.88l3.66-2.84Z"
      />
      <path
        fill="#EA4335"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1A11 11 0 0 0 2.18 7.06l3.66 2.84C6.71 7.3 9.14 5.38 12 5.38Z"
      />
    </svg>
  );
}

function GithubGlyph() {
  return (
    <svg viewBox="0 0 24 24" width={18} height={18} fill="currentColor" aria-hidden>
      <path d="M12 1a11 11 0 0 0-3.48 21.44c.55.1.75-.24.75-.53v-1.86c-3.06.67-3.71-1.48-3.71-1.48-.5-1.27-1.22-1.61-1.22-1.61-1-.68.07-.67.07-.67 1.1.08 1.68 1.13 1.68 1.13.98 1.68 2.57 1.2 3.2.92.1-.71.38-1.2.7-1.48-2.44-.28-5.01-1.22-5.01-5.44 0-1.2.43-2.18 1.13-2.95-.11-.28-.49-1.4.11-2.92 0 0 .92-.3 3.02 1.13a10.5 10.5 0 0 1 5.5 0c2.1-1.43 3.02-1.13 3.02-1.13.6 1.52.22 2.64.11 2.92.7.77 1.13 1.75 1.13 2.95 0 4.23-2.58 5.15-5.03 5.43.39.34.74 1.01.74 2.04v3.02c0 .3.2.64.75.53A11 11 0 0 0 12 1Z" />
    </svg>
  );
}

export default function AuthModal({
  googleEnabled,
  githubEnabled,
  turnstileSiteKey,
  appName,
  tagline,
  authImage,
}: {
  googleEnabled: boolean;
  githubEnabled: boolean;
  turnstileSiteKey: string;
  appName: string;
  tagline: string;
  authImage: string | null;
}) {
  const t = useT();
  const router = useRouter();
  const { open, mode } = useSyncExternalStore(
    subscribeAuthModal,
    getAuthModalState,
    getAuthModalServerState,
  );

  const [name, setName] = useState("");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  const restoreRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (open) return;
    const id = setTimeout(() => {
      setError(null);
      setPassword("");
    }, 0);
    return () => clearTimeout(id);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    restoreRef.current = document.activeElement as HTMLElement | null;
    const focusFirst = window.setTimeout(() => {
      const first = panelRef.current?.querySelector<HTMLElement>(
        "input, button, [href], select, textarea",
      );
      first?.focus();
    }, 0);

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        closeAuthModal();
        return;
      }
      if (e.key !== "Tab" || !panelRef.current) return;
      const nodes = panelRef.current.querySelectorAll<HTMLElement>(
        'a[href], button:not([disabled]), input:not([disabled]), select, textarea, [tabindex]:not([tabindex="-1"])',
      );
      if (nodes.length === 0) return;
      const list = Array.from(nodes);
      const firstEl = list[0];
      const lastEl = list[list.length - 1];
      const activeEl = document.activeElement;
      if (e.shiftKey && activeEl === firstEl) {
        e.preventDefault();
        lastEl.focus();
      } else if (!e.shiftKey && activeEl === lastEl) {
        e.preventDefault();
        firstEl.focus();
      }
    };

    window.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.clearTimeout(focusFirst);
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
      restoreRef.current?.focus?.();
    };
  }, [open]);

  if (!open || typeof document === "undefined") return null;

  const isSignup = mode === "signup";

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const token = turnstileToken();
    const signUpPayload = { name, username, email, password, turnstileToken: token };
    const signInPayload = { email, password, turnstileToken: token };
    const res = isSignup
      ? await authClient.signUp.email(signUpPayload)
      : await authClient.signIn.email(signInPayload);
    setLoading(false);
    if (res.error) {
      setError(res.error.message ?? t("auth.failed"));
      return;
    }
    closeAuthModal();
    router.refresh();
  }

  async function social(provider: "google" | "github") {
    setError(null);
    setLoading(true);
    const { error: err } = await authClient.signIn.social({
      provider,
      callbackURL: "/",
    });
    if (err) {
      setLoading(false);
      setError(err.message ?? t("auth.failed"));
    }
  }

  function switchMode(m: AuthMode) {
    setError(null);
    setAuthMode(m);
  }

  return createPortal(
    <div className="fixed inset-0 z-[130] grid place-items-center p-4">
      <button
        aria-label={t("common.close")}
        tabIndex={-1}
        onClick={closeAuthModal}
        className="absolute inset-0 bg-black/70"
      />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label={isSignup ? t("auth.signUp") : t("auth.signIn")}
        className="relative grid max-h-[calc(100vh-2rem)] w-full max-w-4xl overflow-hidden rounded-2xl bg-yt-raised shadow-2xl md:h-[620px] md:grid-cols-2"
      >
        <button
          onClick={closeAuthModal}
          aria-label={t("common.close")}
          className="absolute right-3 top-3 z-10 grid h-9 w-9 place-items-center rounded-full text-yt-text2 hover:bg-yt-hover hover:text-yt-text"
        >
          <X size={18} />
        </button>

        <div className="relative hidden flex-col justify-between overflow-hidden bg-gradient-to-br from-[#065fd4] via-[#3b82f6] to-[#7c3aed] p-8 text-white md:flex">
          {authImage && (
            <>
              <img
                src={authImage}
                alt=""
                aria-hidden
                className="absolute inset-0 h-full w-full object-cover"
              />
              <span
                aria-hidden
                className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-black/10"
              />
            </>
          )}
          <div className="relative flex items-center gap-2">
            <span className="[&_svg]:h-7 [&_svg]:w-auto [&_span]:text-white">
              <Logo />
            </span>
          </div>
          <div className="relative">
            <p className="text-2xl font-bold leading-snug">{appName}</p>
            <p className="mt-2 text-sm text-white/80">{tagline}</p>
          </div>
          {!authImage && (
            <span
              aria-hidden
              className="pointer-events-none absolute -bottom-16 -right-16 h-64 w-64 rounded-full bg-white/10 blur-2xl"
            />
          )}
        </div>

        <div className="relative min-h-0 max-h-[calc(100vh-2rem)] overflow-y-auto p-6 sm:p-8 md:h-[620px] md:max-h-none">
          <div className="mb-5 inline-flex rounded-full bg-yt-chip p-1 text-sm">
            <button
              type="button"
              aria-pressed={!isSignup}
              onClick={() => switchMode("signin")}
              className={`rounded-full px-4 py-1.5 font-medium ${
                !isSignup ? "bg-yt-raised text-yt-text shadow" : "text-yt-text2"
              }`}
            >
              {t("auth.signIn")}
            </button>
            <button
              type="button"
              aria-pressed={isSignup}
              onClick={() => switchMode("signup")}
              className={`rounded-full px-4 py-1.5 font-medium ${
                isSignup ? "bg-yt-raised text-yt-text shadow" : "text-yt-text2"
              }`}
            >
              {t("auth.signUp")}
            </button>
          </div>

          <h2 className="text-xl font-semibold">
            {isSignup ? t("auth.createTitle") : t("auth.welcomeTitle")}
          </h2>
          <p className="mt-1 text-sm text-yt-text2">
            {isSignup ? t("auth.createSubtitle") : t("auth.welcomeSubtitle")}
          </p>

          <form onSubmit={onSubmit} className="mt-5 space-y-3">
            {isSignup && (
              <>
                <label className="block">
                  <span className="mb-1 block text-xs text-yt-text2">{t("auth.name")}</span>
                  <input
                    type="text"
                    required
                    autoComplete="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className={inputCls}
                  />
                </label>
                <label className="block">
                  <span className="mb-1 block text-xs text-yt-text2">{t("auth.username")}</span>
                  <input
                    type="text"
                    required
                    autoComplete="username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className={inputCls}
                  />
                </label>
              </>
            )}
            <label className="block">
              <span className="mb-1 block text-xs text-yt-text2">{t("auth.email")}</span>
              <input
                type="email"
                required
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={inputCls}
              />
            </label>
            <label className="block">
              <span className="mb-1 block text-xs text-yt-text2">{t("auth.password")}</span>
              <input
                type="password"
                required
                minLength={isSignup ? 8 : undefined}
                autoComplete={isSignup ? "new-password" : "current-password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className={inputCls}
              />
            </label>
            <Turnstile siteKey={turnstileSiteKey} />
            {error && (
              <p role="alert" className="text-sm text-red-600 dark:text-red-400">
                {error}
              </p>
            )}
            <button
              type="submit"
              disabled={loading}
              className="h-11 w-full rounded-full bg-yt-cta text-sm font-medium text-yt-cta-text disabled:opacity-50"
            >
              {loading ? t("auth.processing") : isSignup ? t("auth.signUp") : t("auth.signIn")}
            </button>
          </form>

          {(googleEnabled || githubEnabled) && (
            <>
              <div className="my-4 flex items-center gap-3 text-xs text-yt-text2">
                <span className="h-px flex-1 bg-yt-outline" />
                {t("auth.or")}
                <span className="h-px flex-1 bg-yt-outline" />
              </div>
              <div className="space-y-2">
                {googleEnabled && (
                  <button
                    type="button"
                    disabled={loading}
                    onClick={() => social("google")}
                    className="flex h-11 w-full items-center justify-center gap-2.5 rounded-full border border-yt-searchborder text-sm font-medium hover:bg-yt-hover disabled:opacity-50"
                  >
                    <GoogleGlyph />
                    {t("auth.continueGoogle")}
                  </button>
                )}
                {githubEnabled && (
                  <button
                    type="button"
                    disabled={loading}
                    onClick={() => social("github")}
                    className="flex h-11 w-full items-center justify-center gap-2.5 rounded-full border border-yt-searchborder text-sm font-medium hover:bg-yt-hover disabled:opacity-50"
                  >
                    <GithubGlyph />
                    {t("auth.continueGithub")}
                  </button>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>,
    document.body,
  );
}
