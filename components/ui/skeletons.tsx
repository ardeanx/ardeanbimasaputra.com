import Phantom from "./Phantom";

function CardGhost() {
  return (
    <div className="flex flex-col gap-3">
      <div className="aspect-video w-full rounded-xl bg-yt-hover" />
      <div className="flex gap-3">
        <div className="h-9 w-9 shrink-0 rounded-full bg-yt-hover" />
        <div className="min-w-0 flex-1">
          <p className="text-base font-medium">Judul konten sedang dimuat</p>
          <p className="mt-1 text-sm">Nama kanal</p>
          <p className="text-sm">123 rb dilihat • 1 hari</p>
        </div>
      </div>
    </div>
  );
}

export function GridSkeleton({ count = 9 }: { count?: number }) {
  return (
    <div className="px-6 pb-16 pt-6">
      <Phantom>
        <div className="grid grid-cols-1 gap-x-4 gap-y-10 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: count }, (_, i) => (
            <CardGhost key={i} />
          ))}
        </div>
      </Phantom>
    </div>
  );
}

export function WatchSkeleton() {
  return (
    <div className="mx-auto flex max-w-[1720px] flex-col gap-6 px-4 pb-16 pt-6 lg:flex-row lg:px-6">
      <div className="min-w-0 flex-1">
        <Phantom>
          <div className="aspect-video w-full rounded-xl bg-yt-hover" />
          <p className="mt-3 text-xl font-semibold">Judul konten sedang dimuat di sini</p>
          <div className="mt-3 flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-yt-hover" />
            <div>
              <p className="text-base font-medium">Nama pembuat</p>
              <p className="text-xs">Penulis</p>
            </div>
          </div>
          <div className="mt-4 h-16 rounded-xl bg-yt-hover" />
        </Phantom>
      </div>
      <aside className="w-full shrink-0 lg:w-[402px]">
        <Phantom count={6} countGap={8}>
          <div className="flex gap-2">
            <div className="aspect-video w-[168px] shrink-0 rounded-lg bg-yt-hover" />
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium">Judul konten terkait dimuat</p>
              <p className="mt-1 text-xs">Nama kanal</p>
              <p className="text-xs">100 rb dilihat</p>
            </div>
          </div>
        </Phantom>
      </aside>
    </div>
  );
}

export function TableSkeleton({ rows = 8 }: { rows?: number }) {
  return (
    <div className="mx-auto max-w-6xl">
      <Phantom>
        <p className="text-2xl font-semibold">Konten</p>
        <p className="mt-1 text-sm">Memuat daftar konten…</p>
      </Phantom>
      <div className="mt-6">
        <Phantom count={rows} countGap={10}>
          <div className="flex items-center gap-3 py-2">
            <div className="h-4 w-4 rounded bg-yt-hover" />
            <div className="aspect-video w-[110px] shrink-0 rounded-lg bg-yt-hover" />
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium">Judul konten sedang dimuat</p>
              <p className="mt-1 text-xs">Deskripsi singkat</p>
            </div>
            <p className="w-24 text-xs">Publik</p>
            <p className="w-24 text-xs">1 hari lalu</p>
            <p className="w-16 text-right text-sm">123 rb</p>
          </div>
        </Phantom>
      </div>
    </div>
  );
}
