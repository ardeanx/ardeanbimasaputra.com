export type OgCardData = {
  url: string;
  title?: string | null;
  description?: string | null;
  image?: string | null;
  siteName?: string | null;
};

export default function OgCard({ data }: { data: OgCardData }) {
  const { url, title, description, image, siteName } = data;
  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer nofollow"
      className="flex flex-col overflow-hidden rounded-xl border border-yt-outline bg-yt-raised transition-colors hover:bg-yt-hover sm:flex-row"
    >
      {image ? (
        <img
          src={image}
          alt={title ?? ""}
          className="h-40 w-full object-cover sm:h-auto sm:w-40 sm:shrink-0"
        />
      ) : null}
      <div className="flex min-w-0 flex-col justify-center gap-1 p-3">
        {siteName ? (
          <span className="text-[11px] font-medium uppercase tracking-wide text-yt-text2">
            {siteName}
          </span>
        ) : null}
        <span className="line-clamp-2 font-medium text-yt-text">{title || url}</span>
        {description ? (
          <span className="line-clamp-2 text-sm text-yt-text2">{description}</span>
        ) : null}
      </div>
    </a>
  );
}
