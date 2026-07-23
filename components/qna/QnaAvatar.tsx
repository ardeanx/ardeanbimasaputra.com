type Props = {
  name: string;
  image: string | null;
  size?: number;
  className?: string;
};

export default function QnaAvatar({ name, image, size = 24, className = "" }: Props) {
  const dim = { width: size, height: size };
  if (image) {
    return (
      <img
        src={image}
        alt=""
        style={dim}
        className={`shrink-0 rounded-full bg-yt-hover object-cover ${className}`}
      />
    );
  }
  const initial = (name.trim().charAt(0) || "?").toUpperCase();
  return (
    <span
      aria-hidden
      style={{ ...dim, fontSize: Math.round(size * 0.44) }}
      className={`grid shrink-0 place-items-center rounded-full bg-yt-chip font-semibold text-yt-text2 ${className}`}
    >
      {initial}
    </span>
  );
}
