"use client";

import { Play } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useT } from "@/components/i18n/I18nProvider";

type VastAd = { mediaUrl: string; impressions: string[] };

type Props = {
  src: string;
  poster?: string;
  tagUrl: string;
  skipAfterSec: number;
  timeoutSec: number;
};

function parseVast(xml: string): VastAd | null {
  const doc = new DOMParser().parseFromString(xml, "text/xml");
  const files = Array.from(doc.querySelectorAll("Linear MediaFile"));
  const pick = files.find((f) => (f.getAttribute("type") ?? "").includes("mp4")) ?? files[0];
  const mediaUrl = pick?.textContent?.trim();
  if (!mediaUrl) return null;
  const impressions = Array.from(doc.querySelectorAll("Impression"))
    .map((n) => n.textContent?.trim() ?? "")
    .filter((u) => u.startsWith("http"));
  return { mediaUrl, impressions };
}

export default function VastPlayer({ src, poster, tagUrl, skipAfterSec, timeoutSec }: Props) {
  const t = useT();
  const videoRef = useRef<HTMLVideoElement>(null);
  const adPromise = useRef<Promise<VastAd | null> | null>(null);
  const started = useRef(false);
  const [stage, setStage] = useState<"idle" | "ad" | "content">("idle");
  const [adUrl, setAdUrl] = useState<string | null>(null);
  const [elapsed, setElapsed] = useState(0);
  const [remaining, setRemaining] = useState<number | null>(null);

  useEffect(() => {
    if (adPromise.current) return;
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), timeoutSec * 1000);
    adPromise.current = fetch(tagUrl, { signal: ctrl.signal })
      .then((r) => (r.ok ? r.text() : Promise.reject(new Error(String(r.status)))))
      .then((xml) => parseVast(xml))
      .catch(() => null)
      .finally(() => clearTimeout(timer));
  }, [tagUrl, timeoutSec]);

  useEffect(() => {
    if (stage === "idle") return;
    const v = videoRef.current;
    if (!v) return;
    v.play().catch(() => {
      if (stage === "ad") {
        setAdUrl(null);
        setStage("content");
      }
    });
  }, [stage, adUrl]);

  async function begin() {
    if (started.current) return;
    started.current = true;
    const ad = adPromise.current ? await adPromise.current : null;
    if (ad) {
      for (const u of ad.impressions) {
        const img = new Image();
        img.src = u;
      }
      setAdUrl(ad.mediaUrl);
      setStage("ad");
    } else {
      setStage("content");
    }
  }

  function endAd() {
    setAdUrl(null);
    setRemaining(null);
    setStage("content");
  }

  function onTime() {
    const v = videoRef.current;
    if (!v || stage !== "ad") return;
    setElapsed(v.currentTime);
    setRemaining(
      Number.isFinite(v.duration) ? Math.max(0, Math.ceil(v.duration - v.currentTime)) : null,
    );
  }

  const isAd = stage === "ad" && adUrl != null;

  return (
    <div className="relative overflow-hidden rounded-xl bg-black">
      <video
        ref={videoRef}
        src={isAd ? adUrl : src}
        poster={isAd ? undefined : poster}
        controls={stage === "content"}
        playsInline
        onTimeUpdate={onTime}
        onEnded={isAd ? endAd : undefined}
        onError={isAd ? endAd : undefined}
        className="aspect-video w-full"
      />
      {stage === "idle" && (
        <button
          type="button"
          onClick={begin}
          aria-label={t("aria.play")}
          className="absolute inset-0 grid cursor-pointer place-items-center bg-black/20"
        >
          <span className="grid h-16 w-16 place-items-center rounded-full bg-black/70 text-white">
            <Play className="h-7 w-7 fill-current" />
          </span>
        </button>
      )}
      {isAd && (
        <>
          <span className="absolute left-3 top-3 rounded bg-yellow-400 px-2 py-0.5 text-xs font-semibold text-black">
            {t("ad.label")}
          </span>
          {remaining != null && (
            <span className="absolute bottom-3 left-3 rounded bg-black/70 px-2 py-1 text-xs text-white">
              {t("ad.endsIn", { n: remaining })}
            </span>
          )}
          {skipAfterSec > 0 &&
            (elapsed >= skipAfterSec ? (
              <button
                type="button"
                onClick={endAd}
                className="absolute bottom-3 right-3 rounded bg-black/80 px-4 py-2 text-sm font-medium text-white hover:bg-black"
              >
                {t("ad.skip")}
              </button>
            ) : (
              <span className="absolute bottom-3 right-3 rounded bg-black/60 px-3 py-2 text-xs text-white">
                {t("ad.skipIn", {
                  n: Math.max(1, Math.ceil(skipAfterSec - elapsed)),
                })}
              </span>
            ))}
        </>
      )}
    </div>
  );
}
