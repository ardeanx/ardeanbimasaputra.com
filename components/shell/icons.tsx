import type { ReactNode, SVGProps } from "react";

type P = SVGProps<SVGSVGElement>;

function Base({ children, ...props }: P & { children: ReactNode }) {
  return (
    <svg
      viewBox="0 0 24 24"
      width={24}
      height={24}
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
      {...props}
    >
      {children}
    </svg>
  );
}

export const MenuIcon = (p: P) => (
  <Base {...p}>
    <path d="M4 6h16M4 12h16M4 18h16" />
  </Base>
);

export const SearchIcon = (p: P) => (
  <Base {...p}>
    <circle cx="11" cy="11" r="7" />
    <path d="m16.5 16.5 4.5 4.5" />
  </Base>
);

export const MicIcon = (p: P) => (
  <Base {...p}>
    <rect x="9" y="3" width="6" height="11" rx="3" />
    <path d="M5 11a7 7 0 0 0 14 0M12 18v3" />
  </Base>
);

export const PlusIcon = (p: P) => (
  <Base {...p}>
    <path d="M12 5v14M5 12h14" />
  </Base>
);

export const BellIcon = (p: P) => (
  <Base {...p}>
    <path d="M18 16v-5a6 6 0 1 0-12 0v5l-2 2.5h16L18 16Z" />
    <path d="M10 21a2 2 0 0 0 4 0" />
  </Base>
);

export const HomeIcon = (p: P) => (
  <Base {...p}>
    <path d="M4 11.5 12 4l8 7.5V20a1 1 0 0 1-1 1h-5v-6h-4v6H5a1 1 0 0 1-1-1v-8.5Z" />
  </Base>
);

export const SubscriptionsIcon = (p: P) => (
  <Base {...p}>
    <circle cx="9" cy="8.5" r="3.5" />
    <path d="M3 20c1.1-3.2 3.3-4.8 6-4.8s4.9 1.6 6 4.8" />
    <path d="M15.5 5.3a3.5 3.5 0 0 1 0 6.4" />
    <path d="M17.6 15.9c1.7.8 2.9 2.2 3.4 4.1" />
  </Base>
);

export const HistoryIcon = (p: P) => (
  <Base {...p}>
    <path d="M4.5 12a7.5 7.5 0 1 0 2.2-5.3" />
    <path d="M4.5 4.5V8H8" />
    <path d="M12 8v4.2l2.8 1.8" />
  </Base>
);

export const PlaylistIcon = (p: P) => (
  <Base {...p}>
    <path d="M4 6h12M4 10h12M4 14h7" />
    <path d="m15 13.5 5 3-5 3v-6Z" />
  </Base>
);

export const BookmarkIcon = (p: P) => (
  <Base {...p}>
    <path d="M7 3h10a1 1 0 0 1 1 1v16l-6-3.6L6 20V4a1 1 0 0 1 1-1Z" />
  </Base>
);

export const ClockIcon = (p: P) => (
  <Base {...p}>
    <circle cx="12" cy="12" r="8.5" />
    <path d="M12 7v5.2l3.2 2" />
  </Base>
);

export const ThumbUpIcon = (p: P) => (
  <Base {...p}>
    <path d="M7 10.5 11.2 4c1.3 0 2.3 1 2.3 2.3V10h4.8a2 2 0 0 1 2 2.4l-1.2 6a2 2 0 0 1-2 1.6H7M7 10.5H3.5V20H7M7 10.5V20" />
  </Base>
);

export const ThumbDownIcon = (p: P) => (
  <Base {...p} style={{ transform: "rotate(180deg)" }}>
    <path d="M7 10.5 11.2 4c1.3 0 2.3 1 2.3 2.3V10h4.8a2 2 0 0 1 2 2.4l-1.2 6a2 2 0 0 1-2 1.6H7M7 10.5H3.5V20H7M7 10.5V20" />
  </Base>
);

export const ShareIcon = (p: P) => (
  <Base {...p}>
    <path d="m13.5 5.5 7 6.5-7 6.5v-4C8.5 14.5 5.5 16.5 3 20c.8-6.5 4.7-10 10.5-10.5v-4Z" />
  </Base>
);

export const DownloadIcon = (p: P) => (
  <Base {...p}>
    <path d="M12 4v11m0 0-4.2-4.2M12 15l4.2-4.2M5 20h14" />
  </Base>
);

export const MoreVertIcon = (p: P) => (
  <svg viewBox="0 0 24 24" width={24} height={24} fill="currentColor" aria-hidden {...p}>
    <circle cx="12" cy="5.5" r="1.6" />
    <circle cx="12" cy="12" r="1.6" />
    <circle cx="12" cy="18.5" r="1.6" />
  </svg>
);

export const StoreIcon = (p: P) => (
  <Base {...p}>
    <path d="M4.5 8 6 4h12l1.5 4M4.5 8v11a1 1 0 0 0 1 1h13a1 1 0 0 0 1-1V8M4.5 8h15" />
    <path d="M9.5 12a2.5 2.5 0 0 0 5 0" />
  </Base>
);

export const PersonIcon = (p: P) => (
  <Base {...p}>
    <circle cx="12" cy="8" r="3.5" />
    <path d="M5 20c1.2-3.4 3.8-5 7-5s5.8 1.6 7 5" />
  </Base>
);

export const PersonCircleIcon = (p: P) => (
  <Base {...p}>
    <circle cx="12" cy="12" r="9" />
    <circle cx="12" cy="10" r="3" />
    <path d="M6.5 19c1.2-2.5 3.1-3.8 5.5-3.8s4.3 1.3 5.5 3.8" />
  </Base>
);

export const CompassIcon = (p: P) => (
  <Base {...p}>
    <circle cx="12" cy="12" r="9" />
    <path d="m15.5 8.5-2 5-5 2 2-5 5-2Z" />
  </Base>
);

export const CheckBadgeIcon = ({ className, ...p }: P) => (
  <svg
    viewBox="0 0 24 24"
    width={14}
    height={14}
    fill="currentColor"
    aria-hidden
    className={`text-yt-cta ${className ?? ""}`}
    {...p}
  >
    <path d="M23 12l-2.44-2.78.34-3.68-3.61-.82-1.89-3.18L12 3 8.6 1.54 6.71 4.72l-3.61.81.34 3.68L1 12l2.44 2.78-.34 3.69 3.61.82 1.89 3.18L12 21l3.4 1.46 1.89-3.18 3.61-.82-.34-3.68L23 12z" />
    <path
      d="M10.09 16.72l-3.8-3.81 1.48-1.48 2.32 2.33 5.85-5.87 1.48 1.48-7.33 7.35z"
      fill="#fff"
    />
  </svg>
);

export const DashboardIcon = (p: P) => (
  <Base {...p}>
    <rect x="4" y="4" width="7" height="7" rx="1.5" />
    <rect x="13" y="4" width="7" height="7" rx="1.5" />
    <rect x="4" y="13" width="7" height="7" rx="1.5" />
    <rect x="13" y="13" width="7" height="7" rx="1.5" />
  </Base>
);

export const ContentIcon = (p: P) => (
  <Base {...p}>
    <path d="M6 3h8l4 4v14H6V3Z" />
    <path d="M14 3v4h4" />
    <path d="M9.5 12h5M9.5 16h5" />
  </Base>
);

export const AnalyticsIcon = (p: P) => (
  <Base {...p}>
    <path d="M4 20V10M10 20V4M16 20v-7M22 20H2" />
  </Base>
);

export const CommunityIcon = (p: P) => (
  <Base {...p}>
    <path d="M4 5h16v10H8l-4 4V5Z" />
    <path d="M8 10h8M8 13h5" />
  </Base>
);

export const EarnIcon = (p: P) => (
  <Base {...p}>
    <circle cx="12" cy="12" r="8.5" />
    <path d="M12 7v10M14.5 9.2C13.8 8.4 13 8 12 8c-1.4 0-2.5.8-2.5 2s1.1 1.8 2.5 2 2.5.8 2.5 2-1.1 2-2.5 2c-1 0-1.8-.4-2.5-1.2" />
  </Base>
);

export const CustomizeIcon = (p: P) => (
  <Base {...p}>
    <path d="M15 4l1.2 2.8L19 8l-2.8 1.2L15 12l-1.2-2.8L11 8l2.8-1.2L15 4Z" />
    <path d="m5 19 7-7" />
  </Base>
);

export const SettingsIcon = (p: P) => (
  <Base {...p}>
    <circle cx="12" cy="12" r="3" />
    <path d="M19.5 12a7.5 7.5 0 0 0-.1-1.3l2-1.5-2-3.4-2.3 1a7.5 7.5 0 0 0-2.3-1.3L14.4 2h-4l-.4 2.2a7.5 7.5 0 0 0-2.3 1.3l-2.3-1-2 3.4 2 1.5a7.5 7.5 0 0 0 0 2.6l-2 1.5 2 3.4 2.3-1a7.5 7.5 0 0 0 2.3 1.3l.4 2.2h4l.4-2.2a7.5 7.5 0 0 0 2.3-1.3l2.3 1 2-3.4-2-1.5c.06-.43.1-.86.1-1.3Z" />
  </Base>
);

export const FeedbackIcon = (p: P) => (
  <Base {...p}>
    <path d="M4 5h16v10H8l-4 4V5Z" />
    <path d="M12 8.5a1.6 1.6 0 0 1 1.6 1.6c0 1.1-1.6 1.2-1.6 2.4M12 14.2h.01" />
  </Base>
);

export const HelpCircleIcon = (p: P) => (
  <Base {...p}>
    <circle cx="12" cy="12" r="9" />
    <path d="M9.5 9.5a2.5 2.5 0 0 1 4.6 1.3c0 1.7-2.6 2.2-2.6 3.2M12 17h.01" />
  </Base>
);

export const SparkleIcon = (p: P) => (
  <Base {...p}>
    <path d="M12 3l1.6 4.4L18 9l-4.4 1.6L12 15l-1.6-4.4L6 9l4.4-1.6L12 3Z" />
    <path d="M18 15l.7 2 2 .7-2 .7-.7 2-.7-2-2-.7 2-.7.7-2Z" />
  </Base>
);

export function Logo({ className }: { className?: string }) {
  return (
    <span className={`flex items-start gap-0.5 ${className ?? ""}`}>
      <span className="flex items-center gap-1">
        <svg viewBox="0 0 28 20" width={28} height={20} aria-hidden>
          <rect width="28" height="20" rx="4.5" fill="#065fd4" />
          <path
            d="M10.3 14.5 14 5.5l3.7 9M11.7 11.4h4.6"
            fill="none"
            stroke="#ffffff"
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
        <span className="text-[19px] font-semibold tracking-[-0.05em] leading-none">Ardean</span>
      </span>
      <span className="text-[10px] leading-none text-yt-text2">ID</span>
    </span>
  );
}
