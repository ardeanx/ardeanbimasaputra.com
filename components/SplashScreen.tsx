"use client";

import Image from "next/image";
import { useEffect, useState } from "react";

export default function SplashScreen({ appName, logo }: { appName: string; logo: string | null }) {
  const [phase, setPhase] = useState<"show" | "fade" | "done">(() =>
    typeof window !== "undefined" && sessionStorage.getItem("splash-shown") ? "done" : "show",
  );

  useEffect(() => {
    if (phase !== "show") return;
    sessionStorage.setItem("splash-shown", "1");
    const fade = setTimeout(() => setPhase("fade"), 900);
    const done = setTimeout(() => setPhase("done"), 1400);
    return () => {
      clearTimeout(fade);
      clearTimeout(done);
    };
  }, [phase]);

  if (phase === "done") return null;
  return (
    <div
      className={`fixed inset-0 z-[200] grid place-items-center bg-yt-base transition-opacity duration-500 ${phase === "fade" ? "pointer-events-none opacity-0" : "opacity-100"}`}
    >
      <div className="flex flex-col items-center gap-4">
        {logo ? (
          <Image src={logo} alt="" width={72} height={72} className="rounded-2xl" />
        ) : (
          <div className="grid h-16 w-16 place-items-center rounded-2xl bg-yt-cta text-3xl font-bold text-white">
            {appName.charAt(0)}
          </div>
        )}
        <p className="text-lg font-semibold text-yt-text">{appName}</p>
      </div>
    </div>
  );
}
