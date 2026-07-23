"use client";

import { X } from "lucide-react";
import { useEffect } from "react";
import { createPortal } from "react-dom";

export default function Modal({
  open,
  onClose,
  title,
  children,
  footer,
  size = "md",
  closeOnBackdrop = true,
  closeOnEsc = true,
}: {
  open: boolean;
  onClose: () => void;
  title?: React.ReactNode;
  children: React.ReactNode;
  footer?: React.ReactNode;
  size?: "sm" | "md" | "lg" | "xl";
  closeOnBackdrop?: boolean;
  closeOnEsc?: boolean;
}) {
  useEffect(() => {
    if (!open || !closeOnEsc) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, closeOnEsc, onClose]);

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  if (!open || typeof document === "undefined") return null;

  const width = {
    sm: "max-w-sm",
    md: "max-w-lg",
    lg: "max-w-2xl",
    xl: "max-w-5xl",
  }[size];

  return createPortal(
    <div className="fixed inset-0 z-[120] grid place-items-center p-4">
      <button
        aria-label="Tutup"
        onClick={closeOnBackdrop ? onClose : undefined}
        tabIndex={-1}
        className={`absolute inset-0 bg-black/70 ${closeOnBackdrop ? "" : "cursor-default"}`}
      />
      <div
        role="dialog"
        aria-modal="true"
        className={`relative flex max-h-[90vh] w-full ${width} flex-col overflow-hidden rounded-2xl border border-yt-outline bg-yt-raised shadow-2xl`}
      >
        {title !== undefined && (
          <div className="flex shrink-0 items-center justify-between gap-3 border-b border-yt-outline px-5 py-3.5">
            <h2 className="text-base font-semibold">{title}</h2>
            <button
              onClick={onClose}
              aria-label="Tutup"
              className="grid h-8 w-8 place-items-center rounded-full text-yt-text2 hover:bg-yt-hover hover:text-yt-text"
            >
              <X size={18} />
            </button>
          </div>
        )}
        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4">{children}</div>
        <div className="flex shrink-0 items-center justify-end gap-2 border-t border-yt-outline px-5 py-3.5">
          {footer ?? (
            <button
              onClick={onClose}
              className="h-9 rounded-full border border-yt-outline px-5 text-sm font-medium hover:bg-yt-hover"
            >
              Tutup
            </button>
          )}
        </div>
      </div>
    </div>,
    document.body,
  );
}
