export const REPORT_REASONS = [
  "spam",
  "sexual",
  "violent",
  "hateful",
  "harassment",
  "misinformation",
  "child",
  "copyright",
  "legal",
  "other",
] as const;

export type ReportReason = (typeof REPORT_REASONS)[number];
export type ReportStatus = "OPEN" | "RESOLVED" | "DISMISSED";
