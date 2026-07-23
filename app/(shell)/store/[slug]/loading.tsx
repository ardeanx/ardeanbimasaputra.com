import Phantom from "@/components/ui/Phantom";

export default function Loading() {
  return (
    <div className="mx-auto max-w-5xl px-6 pb-16 pt-6">
      <Phantom>
        <div className="aspect-video w-full rounded-xl bg-yt-hover" />
        <p className="mt-5 text-2xl font-bold">Judul produk sedang dimuat</p>
        <p className="mt-1 text-sm">Nama penjual</p>
        <div className="mt-4 h-24 rounded-xl bg-yt-hover" />
        <div className="mt-6 h-32 rounded-xl bg-yt-hover" />
      </Phantom>
    </div>
  );
}
