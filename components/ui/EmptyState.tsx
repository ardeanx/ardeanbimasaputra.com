import Link from "next/link";
import type { ReactNode } from "react";

export default function EmptyState({
  icon,
  title,
  description,
  action,
  className = "",
}: {
  icon?: ReactNode;
  title: string;
  description?: string;
  action?: { label: string; href: string } | ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`mx-auto flex max-w-sm flex-col items-center px-6 py-14 text-center ${className}`}
    >
      {icon && (
        <div
          aria-hidden
          className="mb-4 grid h-14 w-14 place-items-center rounded-full bg-yt-chip text-yt-text2 [&_svg]:h-7 [&_svg]:w-7"
        >
          {icon}
        </div>
      )}
      <p className="text-base font-medium text-yt-text">{title}</p>
      {description && <p className="mt-1.5 text-sm text-yt-text2">{description}</p>}
      {action &&
        (isLinkAction(action) ? (
          <Link
            href={action.href}
            className="mt-5 inline-flex h-9 items-center rounded-full bg-yt-cta px-5 text-sm font-medium text-yt-cta-text"
          >
            {action.label}
          </Link>
        ) : (
          <div className="mt-5">{action}</div>
        ))}
    </div>
  );
}

function isLinkAction(
  action: { label: string; href: string } | ReactNode,
): action is { label: string; href: string } {
  return typeof action === "object" && action !== null && "href" in action && "label" in action;
}
