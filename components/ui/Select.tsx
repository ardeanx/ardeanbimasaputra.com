"use client";

import { Check, ChevronDown } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

export type SelectOption = {
  value: string;
  label: string;
  hint?: string;
  icon?: React.ReactNode;
};

type MenuPos = { left: number; top: number; width: number; up: boolean };

const MENU_MAX = 288;

export default function Select({
  value,
  options,
  onChange,
  ariaLabel,
  disabled,
  className = "",
  buttonClassName = "",
  menuClassName = "",
}: {
  value: string;
  options: SelectOption[];
  onChange: (value: string) => void;
  ariaLabel: string;
  disabled?: boolean;
  className?: string;
  buttonClassName?: string;
  menuClassName?: string;
}) {
  const [open, setOpen] = useState(false);
  const [index, setIndex] = useState(0);
  const [pos, setPos] = useState<MenuPos | null>(null);
  const rootRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const current = options.find((o) => o.value === value);

  useEffect(() => {
    if (!open) return;
    function onDown(e: PointerEvent) {
      const t = e.target as Node;
      if (!rootRef.current?.contains(t) && !menuRef.current?.contains(t)) setOpen(false);
    }
    function onScroll(e: Event) {
      if (menuRef.current?.contains(e.target as Node)) return;
      setOpen(false);
    }
    window.addEventListener("pointerdown", onDown);
    window.addEventListener("scroll", onScroll, true);
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("pointerdown", onDown);
      window.removeEventListener("scroll", onScroll, true);
      window.removeEventListener("resize", onScroll);
    };
  }, [open]);

  function openMenu() {
    const btn = rootRef.current?.querySelector("button");
    if (!btn) return;
    const r = btn.getBoundingClientRect();
    const spaceBelow = window.innerHeight - r.bottom;
    const up = spaceBelow < MENU_MAX && r.top > spaceBelow;
    setPos({
      left: Math.min(r.left, window.innerWidth - 180),
      top: up ? r.top - 4 : r.bottom + 4,
      width: Math.max(r.width, 176),
      up,
    });
    const i = options.findIndex((o) => o.value === value);
    setIndex(i < 0 ? 0 : i);
    setOpen(true);
  }

  function onKeyDown(e: React.KeyboardEvent) {
    if (!open) {
      if (e.key === "Enter" || e.key === " " || e.key === "ArrowDown") {
        e.preventDefault();
        openMenu();
      }
      return;
    }
    if (e.key === "Escape" || e.key === "Tab") {
      setOpen(false);
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      setIndex((i) => (i + 1) % options.length);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setIndex((i) => (i - 1 + options.length) % options.length);
    } else if (e.key === "Enter") {
      e.preventDefault();
      const opt = options[Math.min(index, options.length - 1)];
      if (opt) {
        onChange(opt.value);
        setOpen(false);
      }
    }
  }

  return (
    <div ref={rootRef} className={`relative ${className}`} onKeyDown={onKeyDown}>
      <button
        type="button"
        aria-label={ariaLabel}
        aria-haspopup="listbox"
        aria-expanded={open}
        disabled={disabled}
        onClick={() => (open ? setOpen(false) : openMenu())}
        className={
          buttonClassName ||
          "flex h-10 w-full items-center gap-2 rounded-lg border border-yt-outline bg-transparent px-3 text-left text-sm hover:bg-yt-hover disabled:opacity-50"
        }
      >
        {current?.icon}
        <span className="min-w-0 flex-1 truncate">{current?.label ?? value}</span>
        <ChevronDown
          size={16}
          className={`shrink-0 text-yt-text2 transition-transform ${open ? "rotate-180" : ""}`}
        />
      </button>

      {open &&
        pos &&
        createPortal(
          <div
            ref={menuRef}
            role="listbox"
            aria-label={ariaLabel}
            style={{
              left: pos.left,
              width: pos.width,
              ...(pos.up ? { bottom: window.innerHeight - pos.top } : { top: pos.top }),
            }}
            className={`fixed z-[110] max-h-72 overflow-y-auto rounded-xl bg-yt-menu py-1.5 shadow-[0_4px_32px_rgba(0,0,0,0.3)] ${menuClassName}`}
          >
            {options.map((o, i) => (
              <button
                key={o.value}
                type="button"
                role="option"
                aria-selected={o.value === value}
                onClick={() => {
                  onChange(o.value);
                  setOpen(false);
                }}
                onPointerMove={() => setIndex(i)}
                className={`flex w-full items-center gap-2.5 px-3 py-2 text-left text-sm ${
                  i === index ? "bg-yt-hover" : ""
                }`}
              >
                {o.icon}
                <span className="min-w-0 flex-1">
                  <span className="block truncate">{o.label}</span>
                  {o.hint && <span className="block truncate text-xs text-yt-text2">{o.hint}</span>}
                </span>
                {o.value === value && <Check size={16} className="shrink-0 text-yt-cta" />}
              </button>
            ))}
          </div>,
          document.body,
        )}
    </div>
  );
}
