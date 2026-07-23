import Phantom from "@/components/ui/Phantom";

export default function Loading() {
  return (
    <div className="mx-auto max-w-6xl px-4 pb-16 pt-4 lg:px-6">
      <Phantom>
        <div className="aspect-[21/9] min-h-[280px] w-full rounded-2xl bg-yt-hover" />
        <div className="mx-auto mt-8 flex max-w-prose items-center gap-3">
          <div className="h-11 w-11 shrink-0 rounded-full bg-yt-hover" />
          <div>
            <p className="text-base font-medium">Nama penulis sedang dimuat</p>
            <p className="text-xs">Penulis</p>
          </div>
        </div>
      </Phantom>
      <div className="mt-8">
        <Phantom count={4} countGap={14}>
          <div className="mx-auto max-w-prose">
            <p className="text-2xl font-semibold">Judul bagian dimuat</p>
            <p className="mt-3 text-base">
              Paragraf artikel sedang dimuat, mohon tunggu sebentar sampai konten lengkap tersedia
              untuk dibaca.
            </p>
            <p className="mt-2 text-base">
              Baris berikutnya dari artikel juga sedang dimuat di tempat ini.
            </p>
          </div>
        </Phantom>
      </div>
    </div>
  );
}
