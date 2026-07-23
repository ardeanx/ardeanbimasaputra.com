"use client";

import { type ReactNode, useState } from "react";

export default function DetailTabs({
  tabs,
}: {
  tabs: { key: string; label: string; panel: ReactNode }[];
}) {
  const [active, setActive] = useState(tabs[0]?.key);

  return (
    <>
      <div className="flex gap-6 border-b border-yt-outline">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            type="button"
            onClick={() => setActive(tab.key)}
            className={`-mb-px border-b-2 py-3 text-sm font-medium transition-colors ${
              active === tab.key
                ? "border-yt-text text-yt-text"
                : "border-transparent text-yt-text2 hover:text-yt-text"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>
      {tabs.map((tab) => (
        <div key={tab.key} className={active === tab.key ? "mt-6" : "hidden"}>
          {tab.panel}
        </div>
      ))}
    </>
  );
}
