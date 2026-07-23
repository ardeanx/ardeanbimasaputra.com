import { CheckBadgeIcon } from "@/components/shell/icons";
import QnaAvatar from "./QnaAvatar";
import type { QnaAuthor } from "@/lib/qna";

export default function AuthorByline({
  author,
  ago,
  action,
  avatarSize = 20,
  className = "",
}: {
  author: QnaAuthor;
  ago: string;
  action?: string;
  avatarSize?: number;
  className?: string;
}) {
  return (
    <div className={`flex flex-wrap items-center gap-1.5 text-xs text-yt-text2 ${className}`}>
      {action && <span>{action}</span>}
      <QnaAvatar name={author.name} image={author.image} size={avatarSize} />
      <span className="font-medium text-yt-text">{author.name}</span>
      {author.verified && <CheckBadgeIcon width={13} height={13} />}
      <span>· {ago}</span>
    </div>
  );
}
