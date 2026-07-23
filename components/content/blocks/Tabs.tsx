"use client";

import { useState, type ReactNode } from "react";

export default function Tabs({ labels, children }: { labels: string[]; children: ReactNode[] }) {
  const [active, setActive] = useState(0);
  return (
    <div className="tabs my-4">
      <div className="tab-btns">
        {labels.map((label, i) => (
          <button
            key={i}
            type="button"
            onClick={() => setActive(i)}
            className={`tab-btn ${i === active ? "is-active" : ""}`}
          >
            {label}
          </button>
        ))}
      </div>
      {children.map((panel, i) => (
        <div key={i} hidden={i !== active} className="tab-panel">
          {panel}
        </div>
      ))}
    </div>
  );
}
