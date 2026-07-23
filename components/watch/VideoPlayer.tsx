"use client";

import {
  AudioLines,
  Check,
  ChevronLeft,
  ChevronRight,
  Gauge,
  Moon,
  Pause,
  Play,
  Settings,
  SlidersHorizontal,
  Tv,
  Volume1,
  Volume2,
  VolumeX,
} from "lucide-react";
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
} from "react";
import { useT } from "@/components/i18n/I18nProvider";

type Props = { src: string; poster?: string | null; className?: string };

const SPEEDS = [0.25, 0.5, 0.75, 1, 1.25, 1.5, 1.75, 2];
const SLEEP = [0, 15, 30, 45, 60, -1];

function fmtTime(s: number): string {
  if (!Number.isFinite(s) || s < 0) s = 0;
  const total = Math.floor(s);
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const sec = total % 60;
  const mm = h > 0 ? String(m).padStart(2, "0") : String(m);
  return `${h > 0 ? `${h}:` : ""}${mm}:${String(sec).padStart(2, "0")}`;
}

function CcIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="currentColor" aria-hidden>
      <path d="M19 4H5c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm-8 7H9.5v-.5h-2v3h2V13H11v1c0 .55-.45 1-1 1H7c-.55 0-1-.45-1-1v-4c0-.55.45-1 1-1h3c.55 0 1 .45 1 1v1zm7 0h-1.5v-.5h-2v3h2V13H18v1c0 .55-.45 1-1 1h-3c-.55 0-1-.45-1-1v-4c0-.55.45-1 1-1h3c.55 0 1 .45 1 1v1z" />
    </svg>
  );
}

function TheaterIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="currentColor" aria-hidden>
      <path d="M21 7H3c-.55 0-1 .45-1 1v8c0 .55.45 1 1 1h18c.55 0 1-.45 1-1V8c0-.55-.45-1-1-1zm-1 8H4V9h16v6z" />
    </svg>
  );
}

function FullscreenIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="currentColor" aria-hidden>
      <path d="M7 14H5v5h5v-2H7v-3zm-2-4h2V7h3V5H5v5zm12 7h-3v2h5v-5h-2v3zM14 5v2h3v3h2V5h-5z" />
    </svg>
  );
}

function ExitFullscreenIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="currentColor" aria-hidden>
      <path d="M5 16h3v3h2v-5H5v2zm3-8H5v2h5V5H8v3zm6 11h2v-3h3v-2h-5v5zm2-11V5h-2v5h5V8h-3z" />
    </svg>
  );
}

export default function VideoPlayer({ src, poster, className }: Props) {
  const t = useT();
  const wrapRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const barRef = useRef<HTMLDivElement>(null);
  const hideTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const sleepTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const settingsRef = useRef(false);

  const [playing, setPlaying] = useState(false);
  const [current, setCurrent] = useState(0);
  const [duration, setDuration] = useState(0);
  const [buffered, setBuffered] = useState(0);
  const [volume, setVolume] = useState(1);
  const [muted, setMuted] = useState(false);
  const [showUi, setShowUi] = useState(true);
  const [settings, setSettings] = useState(false);
  const [submenu, setSubmenu] = useState<"sleep" | "speed" | "quality" | null>(null);
  const [speed, setSpeed] = useState(1);
  const [quality, setQuality] = useState(t("player.qualityAuto"));
  const [sleep, setSleep] = useState(0);
  const [ambient, setAmbient] = useState(true);
  const [stableVolume, setStableVolume] = useState(true);
  const [theater, setTheater] = useState(false);
  const [autoplay, setAutoplay] = useState(true);
  const [fullscreen, setFullscreen] = useState(false);
  const [scrubbing, setScrubbing] = useState(false);

  const kick = useCallback(() => {
    setShowUi(true);
    if (hideTimer.current) clearTimeout(hideTimer.current);
    const v = videoRef.current;
    if (v && !v.paused && !settingsRef.current) {
      hideTimer.current = setTimeout(() => setShowUi(false), 2500);
    }
  }, []);

  const handlePlay = useCallback(() => {
    setPlaying(true);
    setShowUi(true);
    if (hideTimer.current) clearTimeout(hideTimer.current);
    hideTimer.current = setTimeout(() => {
      if (videoRef.current && !videoRef.current.paused && !settingsRef.current) setShowUi(false);
    }, 2500);
  }, []);

  const handlePause = useCallback(() => {
    setPlaying(false);
    if (hideTimer.current) clearTimeout(hideTimer.current);
    setShowUi(true);
  }, []);

  const togglePlay = useCallback(() => {
    const v = videoRef.current;
    if (!v) return;
    if (v.paused) v.play().catch(() => {});
    else v.pause();
  }, []);

  const toggleMute = useCallback(() => {
    const v = videoRef.current;
    if (!v) return;
    v.muted = !v.muted;
    setMuted(v.muted);
  }, []);

  const changeVolume = useCallback((val: number) => {
    const v = videoRef.current;
    if (!v) return;
    const clamped = Math.min(1, Math.max(0, val));
    v.volume = clamped;
    v.muted = clamped === 0;
    setVolume(clamped);
    setMuted(clamped === 0);
  }, []);

  const toggleFullscreen = useCallback(() => {
    const w = wrapRef.current;
    if (typeof document === "undefined" || !w) return;
    if (document.fullscreenElement) document.exitFullscreen().catch(() => {});
    else w.requestFullscreen().catch(() => {});
  }, []);

  const seekBy = useCallback((delta: number) => {
    const v = videoRef.current;
    if (!v) return;
    v.currentTime = Math.min(v.duration || 0, Math.max(0, v.currentTime + delta));
  }, []);

  const seekToClientX = useCallback((clientX: number) => {
    const bar = barRef.current;
    const v = videoRef.current;
    if (!bar || !v || !Number.isFinite(v.duration)) return;
    const rect = bar.getBoundingClientRect();
    const ratio = Math.min(1, Math.max(0, (clientX - rect.left) / rect.width));
    v.currentTime = ratio * v.duration;
    setCurrent(v.currentTime);
  }, []);

  const onBarDown = useCallback(
    (e: ReactPointerEvent) => {
      e.preventDefault();
      setScrubbing(true);
      seekToClientX(e.clientX);
      const move = (ev: PointerEvent) => seekToClientX(ev.clientX);
      const up = () => {
        setScrubbing(false);
        window.removeEventListener("pointermove", move);
        window.removeEventListener("pointerup", up);
      };
      window.addEventListener("pointermove", move);
      window.addEventListener("pointerup", up);
    },
    [seekToClientX],
  );

  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    setPlaying(!v.paused);
    setCurrent(v.currentTime);
    if (v.duration) setDuration(v.duration);
    if (v.buffered.length) setBuffered(v.buffered.end(v.buffered.length - 1));
  }, []);

  useEffect(() => {
    if (typeof document === "undefined") return;
    const onFs = () => setFullscreen(!!document.fullscreenElement);
    document.addEventListener("fullscreenchange", onFs);
    return () => document.removeEventListener("fullscreenchange", onFs);
  }, []);

  useEffect(() => {
    settingsRef.current = settings;
  }, [settings]);

  useEffect(() => {
    if (sleepTimer.current) {
      clearTimeout(sleepTimer.current);
      sleepTimer.current = null;
    }
    if (sleep > 0) {
      sleepTimer.current = setTimeout(() => videoRef.current?.pause(), sleep * 60000);
    }
    return () => {
      if (sleepTimer.current) clearTimeout(sleepTimer.current);
    };
  }, [sleep]);

  useEffect(() => {
    if (!ambient) return;
    const v = videoRef.current;
    const c = canvasRef.current;
    if (!v || !c) return;
    const ctx = c.getContext("2d");
    if (!ctx) return;
    let raf = 0;
    const id = setInterval(() => {
      if (v.readyState < 2 || v.paused) return;
      c.width = 128;
      c.height = 72;
      raf = requestAnimationFrame(() => {
        try {
          ctx.drawImage(v, 0, 0, 128, 72);
        } catch {}
      });
    }, 100);
    return () => {
      clearInterval(id);
      cancelAnimationFrame(raf);
    };
  }, [ambient]);

  useEffect(() => {
    const el = document.documentElement;
    if (ambient) el.setAttribute("data-ambient", "on");
    else el.removeAttribute("data-ambient");
    return () => el.removeAttribute("data-ambient");
  }, [ambient]);

  useEffect(() => {
    const el = document.documentElement;
    if (theater) el.setAttribute("data-theater", "on");
    else el.removeAttribute("data-theater");
    return () => el.removeAttribute("data-theater");
  }, [theater]);

  const onEnded = useCallback(() => {
    if (sleep === -1) videoRef.current?.pause();
  }, [sleep]);

  const onKey = useCallback(
    (e: React.KeyboardEvent) => {
      const k = e.key.toLowerCase();
      if (k === " " || k === "k") {
        e.preventDefault();
        togglePlay();
      } else if (k === "m") toggleMute();
      else if (k === "f") toggleFullscreen();
      else if (k === "t") setTheater((v) => !v);
      else if (e.key === "ArrowLeft") {
        e.preventDefault();
        seekBy(-5);
      } else if (e.key === "ArrowRight") {
        e.preventDefault();
        seekBy(5);
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        changeVolume(volume + 0.05);
      } else if (e.key === "ArrowDown") {
        e.preventDefault();
        changeVolume(volume - 0.05);
      }
      kick();
    },
    [togglePlay, toggleMute, toggleFullscreen, seekBy, changeVolume, volume, kick],
  );

  const pct = duration > 0 ? (current / duration) * 100 : 0;
  const bufPct = duration > 0 ? (buffered / duration) * 100 : 0;
  const VolIcon = muted || volume === 0 ? VolumeX : volume < 0.5 ? Volume1 : Volume2;
  const iconBtn =
    "grid h-10 w-10 place-items-center rounded-full text-[#0f0f0f] transition-colors hover:bg-black/10";
  const circleBtn =
    "grid h-10 w-10 place-items-center rounded-full bg-white/60 text-[#0f0f0f] backdrop-blur-md transition hover:bg-white/75";

  return (
    <div className={`vp-root relative ${className ?? ""}`}>
      {ambient && (
        <canvas
          ref={canvasRef}
          aria-hidden
          className="pointer-events-none absolute inset-0 -z-10 h-full w-full scale-x-110 scale-y-150 rounded-xl opacity-40 blur-3xl saturate-125"
        />
      )}
      <div
        ref={wrapRef}
        tabIndex={0}
        onKeyDown={onKey}
        onMouseMove={kick}
        onMouseLeave={() => playing && !settings && setShowUi(false)}
        className="group relative aspect-video overflow-hidden rounded-xl bg-black outline-none"
      >
        <video
          ref={videoRef}
          src={src}
          poster={poster ?? undefined}
          playsInline
          autoPlay={autoplay}
          muted={muted}
          onClick={togglePlay}
          onEnded={onEnded}
          onPlay={handlePlay}
          onPlaying={handlePlay}
          onPause={handlePause}
          onTimeUpdate={(e) => setCurrent(e.currentTarget.currentTime)}
          onDurationChange={(e) => setDuration(e.currentTarget.duration || 0)}
          onLoadedMetadata={(e) => setDuration(e.currentTarget.duration || 0)}
          onProgress={(e) => {
            const el = e.currentTarget;
            if (el.buffered.length) setBuffered(el.buffered.end(el.buffered.length - 1));
          }}
          className="h-full w-full"
        />

        {!playing && (
          <button
            type="button"
            onClick={togglePlay}
            aria-label={t("aria.play")}
            className="absolute inset-0 grid place-items-center bg-black/10"
          >
            <span className="grid h-16 w-16 place-items-center rounded-full bg-black/55 text-white transition hover:bg-black/70">
              <Play className="h-8 w-8 translate-x-0.5 fill-current" />
            </span>
          </button>
        )}

        <div
          className={`absolute inset-x-0 bottom-0 z-10 pt-10 transition-opacity duration-200 ${
            showUi || !playing ? "opacity-100" : "pointer-events-none opacity-0"
          }`}
        >
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/25 to-transparent"
          />

          <div className="relative px-3 pb-1.5">
            <div
              ref={barRef}
              onPointerDown={onBarDown}
              className="group/bar relative mb-1 flex h-4 cursor-pointer items-center"
            >
              <div className="relative h-1 w-full rounded-full bg-white/30 transition-[height] group-hover/bar:h-1.5">
                <div
                  className="absolute inset-y-0 left-0 rounded-full bg-white/50"
                  style={{ width: `${bufPct}%` }}
                />
                <div
                  className="absolute inset-y-0 left-0 rounded-full bg-yt-cta"
                  style={{ width: `${pct}%` }}
                />
                <div
                  className={`absolute top-1/2 h-[13px] w-[13px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-yt-cta transition-transform ${
                    scrubbing ? "scale-100" : "scale-0 group-hover/bar:scale-100"
                  }`}
                  style={{ left: `${pct}%` }}
                />
              </div>
            </div>

            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={togglePlay}
                aria-label={t("aria.play")}
                className={circleBtn}
              >
                {playing ? (
                  <Pause className="h-6 w-6 fill-current" />
                ) : (
                  <Play className="h-6 w-6 fill-current" />
                )}
              </button>

              <div className="group/vol flex items-center">
                <button
                  type="button"
                  onClick={toggleMute}
                  aria-label={t("player.volume")}
                  className={circleBtn}
                >
                  <VolIcon className="h-6 w-6" />
                </button>
                <div className="flex w-0 items-center overflow-hidden transition-all duration-200 group-hover/vol:w-24 group-hover/vol:pl-1 group-hover/vol:pr-2">
                  <input
                    type="range"
                    min={0}
                    max={1}
                    step={0.01}
                    value={muted ? 0 : volume}
                    onChange={(e) => changeVolume(Number(e.target.value))}
                    aria-label={t("player.volume")}
                    className="vp-range h-3 w-20"
                  />
                </div>
              </div>

              <span className="ml-1 flex h-10 select-none items-center rounded-full bg-white/60 px-3.5 text-[13px] font-medium text-[#0f0f0f] backdrop-blur-md">
                {fmtTime(current)} / {fmtTime(duration)}
              </span>

              <div className="ml-auto flex items-center gap-0.5 rounded-full bg-white/60 px-1.5 backdrop-blur-md">
                <button
                  type="button"
                  onClick={() => setAutoplay((a) => !a)}
                  aria-label={t("player.autoplay")}
                  title={t("player.autoplay")}
                  className="mx-1 flex h-5 w-9 items-center rounded-full bg-black/40 px-0.5 transition-colors data-[on=true]:bg-black/60"
                  data-on={autoplay}
                >
                  <span
                    className={`grid h-4 w-4 place-items-center rounded-full bg-white text-black transition-transform ${
                      autoplay ? "translate-x-4" : "translate-x-0"
                    }`}
                  >
                    <Play className="h-2 w-2 fill-current" />
                  </span>
                </button>

                <button
                  type="button"
                  disabled
                  title={t("player.captionsUnavailable")}
                  aria-label={t("player.captionsUnavailable")}
                  className="grid h-10 w-10 cursor-default place-items-center rounded-full text-black/40"
                >
                  <CcIcon className="h-6 w-6" />
                </button>

                <div className="relative">
                  <button
                    type="button"
                    onClick={() => {
                      setSettings((s) => !s);
                      setSubmenu(null);
                      setShowUi(true);
                    }}
                    aria-label={t("player.settings")}
                    className={`${iconBtn} relative`}
                  >
                    <Settings className="h-[22px] w-[22px]" />
                    <span className="absolute right-1 top-1.5 rounded-sm bg-red-600 px-1 text-[8px] font-bold leading-3 text-white">
                      HD
                    </span>
                  </button>

                  {settings && (
                    <div className="absolute bottom-12 right-0 min-w-[300px] overflow-hidden rounded-xl bg-[#282828] py-2 text-sm text-white shadow-2xl">
                      {submenu === null && (
                        <>
                          <button
                            type="button"
                            onClick={() => setStableVolume((s) => !s)}
                            className="flex w-full items-center gap-3 px-4 py-2.5 hover:bg-white/10"
                          >
                            <AudioLines className="h-5 w-5 shrink-0" />
                            <span className="flex-1 text-left">{t("player.stableVolume")}</span>
                            <span
                              className={`flex h-4 w-8 items-center rounded-full px-0.5 ${
                                stableVolume ? "bg-red-600" : "bg-white/25"
                              }`}
                            >
                              <span
                                className={`h-3 w-3 rounded-full bg-white transition-transform ${
                                  stableVolume ? "translate-x-4" : "translate-x-0"
                                }`}
                              />
                            </span>
                          </button>
                          <button
                            type="button"
                            onClick={() => setAmbient((a) => !a)}
                            className="flex w-full items-center gap-3 px-4 py-2.5 hover:bg-white/10"
                          >
                            <Tv className="h-5 w-5 shrink-0" />
                            <span className="flex-1 text-left">{t("player.ambientMode")}</span>
                            <span
                              className={`flex h-4 w-8 items-center rounded-full px-0.5 ${
                                ambient ? "bg-red-600" : "bg-white/25"
                              }`}
                            >
                              <span
                                className={`h-3 w-3 rounded-full bg-white transition-transform ${
                                  ambient ? "translate-x-4" : "translate-x-0"
                                }`}
                              />
                            </span>
                          </button>
                          <button
                            type="button"
                            onClick={() => setSubmenu("sleep")}
                            className="flex w-full items-center gap-3 px-4 py-2.5 hover:bg-white/10"
                          >
                            <Moon className="h-5 w-5 shrink-0" />
                            <span className="flex-1 text-left">{t("player.sleepTimer")}</span>
                            <span className="text-yt-text2">
                              {sleep === 0
                                ? t("player.off")
                                : sleep === -1
                                  ? t("player.endOfVideo")
                                  : t("player.min", { n: sleep })}
                            </span>
                            <ChevronRight className="h-4 w-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => setSubmenu("speed")}
                            className="flex w-full items-center gap-3 px-4 py-2.5 hover:bg-white/10"
                          >
                            <Gauge className="h-5 w-5 shrink-0" />
                            <span className="flex-1 text-left">{t("player.playbackSpeed")}</span>
                            <span className="text-yt-text2">
                              {speed === 1 ? t("player.normal") : `${speed}x`}
                            </span>
                            <ChevronRight className="h-4 w-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => setSubmenu("quality")}
                            className="flex w-full items-center gap-3 px-4 py-2.5 hover:bg-white/10"
                          >
                            <SlidersHorizontal className="h-5 w-5 shrink-0" />
                            <span className="flex-1 text-left">{t("player.quality")}</span>
                            <span className="text-yt-text2">{quality}</span>
                            <ChevronRight className="h-4 w-4" />
                          </button>
                        </>
                      )}

                      {submenu === "sleep" && (
                        <>
                          <button
                            type="button"
                            onClick={() => setSubmenu(null)}
                            className="mb-1 flex w-full items-center gap-2 border-b border-yt-outline px-4 py-2 font-medium hover:bg-white/10"
                          >
                            <ChevronLeft className="h-4 w-4" />
                            {t("player.sleepTimer")}
                          </button>
                          {SLEEP.map((s) => (
                            <button
                              key={s}
                              type="button"
                              onClick={() => {
                                setSleep(s);
                                setSubmenu(null);
                              }}
                              className="flex w-full items-center gap-3 px-4 py-2 hover:bg-white/10"
                            >
                              <Check
                                className={`h-4 w-4 ${sleep === s ? "opacity-100" : "opacity-0"}`}
                              />
                              {s === 0
                                ? t("player.off")
                                : s === -1
                                  ? t("player.endOfVideo")
                                  : t("player.min", { n: s })}
                            </button>
                          ))}
                        </>
                      )}

                      {submenu === "speed" && (
                        <>
                          <button
                            type="button"
                            onClick={() => setSubmenu(null)}
                            className="mb-1 flex w-full items-center gap-2 border-b border-yt-outline px-4 py-2 font-medium hover:bg-white/10"
                          >
                            <ChevronLeft className="h-4 w-4" />
                            {t("player.playbackSpeed")}
                          </button>
                          {SPEEDS.map((s) => (
                            <button
                              key={s}
                              type="button"
                              onClick={() => {
                                setSpeed(s);
                                if (videoRef.current) videoRef.current.playbackRate = s;
                                setSubmenu(null);
                              }}
                              className="flex w-full items-center gap-3 px-4 py-2 hover:bg-white/10"
                            >
                              <Check
                                className={`h-4 w-4 ${speed === s ? "opacity-100" : "opacity-0"}`}
                              />
                              {s === 1 ? t("player.normal") : `${s}x`}
                            </button>
                          ))}
                        </>
                      )}

                      {submenu === "quality" && (
                        <>
                          <button
                            type="button"
                            onClick={() => setSubmenu(null)}
                            className="mb-1 flex w-full items-center gap-2 border-b border-yt-outline px-4 py-2 font-medium hover:bg-white/10"
                          >
                            <ChevronLeft className="h-4 w-4" />
                            {t("player.quality")}
                          </button>
                          {[t("player.qualityAuto"), "1080p HD", "720p", "480p", "360p"].map(
                            (q) => (
                              <button
                                key={q}
                                type="button"
                                onClick={() => {
                                  setQuality(q);
                                  setSubmenu(null);
                                }}
                                className="flex w-full items-center gap-3 px-4 py-2 hover:bg-white/10"
                              >
                                <Check
                                  className={`h-4 w-4 ${quality === q ? "opacity-100" : "opacity-0"}`}
                                />
                                {q}
                              </button>
                            ),
                          )}
                        </>
                      )}
                    </div>
                  )}
                </div>

                <button
                  type="button"
                  onClick={() => setTheater((v) => !v)}
                  aria-label={t("player.theater")}
                  title={t("player.theater")}
                  className={`${iconBtn} ${theater ? "bg-white/15" : ""}`}
                >
                  <TheaterIcon className="h-6 w-6" />
                </button>

                <button
                  type="button"
                  onClick={toggleFullscreen}
                  aria-label={t("player.fullscreen")}
                  className={iconBtn}
                >
                  {fullscreen ? (
                    <ExitFullscreenIcon className="h-6 w-6" />
                  ) : (
                    <FullscreenIcon className="h-6 w-6" />
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
