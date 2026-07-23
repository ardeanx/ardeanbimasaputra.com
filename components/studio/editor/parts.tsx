export const field =
  "w-full rounded-lg border border-yt-outline bg-transparent px-3 py-2 text-sm outline-none focus:border-yt-cta";

export function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="px-4 py-4">
      <h3 className="mb-3 text-xs font-semibold uppercase tracking-wide text-yt-text2">{title}</h3>
      {children}
    </section>
  );
}
