"use client";

import { useMemo, useState } from "react";
import { useT } from "@/components/i18n/I18nProvider";

type Entry = [string, string];

const GROUPS: Array<{ id: string; items: Entry[] }> = [
  {
    id: "smileys",
    items: [
      ["😀", "grin happy"],
      ["😃", "smile happy"],
      ["😄", "laugh happy"],
      ["😁", "beam grin"],
      ["😆", "laugh"],
      ["😅", "sweat laugh"],
      ["🤣", "rofl laugh"],
      ["😂", "joy tears laugh"],
      ["🙂", "slight smile"],
      ["🙃", "upside down"],
      ["😉", "wink"],
      ["😊", "blush smile"],
      ["😇", "angel innocent"],
      ["🥰", "love hearts"],
      ["😍", "heart eyes love"],
      ["🤩", "star struck"],
      ["😘", "kiss"],
      ["😗", "kissing"],
      ["😚", "kiss closed"],
      ["😋", "yum tasty"],
      ["😛", "tongue"],
      ["😜", "wink tongue"],
      ["🤪", "zany crazy"],
      ["😝", "tongue squint"],
      ["🤑", "money mouth"],
      ["🤗", "hug"],
      ["🤭", "hand over mouth"],
      ["🤫", "shush quiet"],
      ["🤔", "thinking"],
      ["🤐", "zipper mouth"],
      ["😐", "neutral"],
      ["😑", "expressionless"],
      ["😶", "no mouth"],
      ["😏", "smirk"],
      ["😒", "unamused"],
      ["🙄", "eye roll"],
      ["😬", "grimace"],
      ["😴", "sleep"],
      ["😌", "relieved"],
      ["😔", "pensive sad"],
      ["😪", "sleepy"],
      ["😷", "mask sick"],
      ["🤒", "thermometer sick"],
      ["🤕", "bandage hurt"],
      ["🤢", "nauseated sick"],
      ["🤮", "vomit sick"],
      ["🥵", "hot"],
      ["🥶", "cold"],
      ["😵", "dizzy"],
      ["🤯", "mind blown"],
      ["😎", "cool sunglasses"],
      ["🤓", "nerd geek"],
      ["🧐", "monocle"],
      ["😕", "confused"],
      ["😟", "worried"],
      ["🙁", "frown sad"],
      ["😮", "surprised open mouth"],
      ["😯", "hushed"],
      ["😲", "astonished shock"],
      ["😳", "flushed"],
      ["🥺", "pleading"],
      ["😦", "frowning"],
      ["😨", "fearful scared"],
      ["😰", "anxious sweat"],
      ["😥", "sad relieved"],
      ["😢", "cry sad"],
      ["😭", "sob crying"],
      ["😱", "scream fear"],
      ["😖", "confounded"],
      ["😣", "persevere"],
      ["😞", "disappointed sad"],
      ["😓", "downcast sweat"],
      ["😩", "weary tired"],
      ["😫", "tired"],
      ["🥱", "yawn"],
      ["😤", "triumph steam"],
      ["😡", "angry rage"],
      ["😠", "angry mad"],
      ["🤬", "cursing swear"],
      ["😈", "devil smiling"],
      ["💀", "skull dead"],
      ["🤡", "clown"],
      ["👻", "ghost"],
      ["👽", "alien"],
      ["🤖", "robot"],
      ["💩", "poop"],
    ],
  },
  {
    id: "gestures",
    items: [
      ["👍", "thumbs up like yes"],
      ["👎", "thumbs down dislike no"],
      ["👌", "ok"],
      ["🤌", "pinched fingers"],
      ["✌️", "victory peace"],
      ["🤞", "fingers crossed luck"],
      ["🤟", "love you"],
      ["🤘", "rock horns"],
      ["🤙", "call me"],
      ["👈", "point left"],
      ["👉", "point right"],
      ["👆", "point up"],
      ["👇", "point down"],
      ["☝️", "index up"],
      ["✋", "raised hand stop"],
      ["🖐️", "hand fingers"],
      ["🖖", "vulcan"],
      ["👋", "wave hello bye"],
      ["🤝", "handshake deal"],
      ["👏", "clap applause"],
      ["🙌", "raised hands praise"],
      ["👐", "open hands"],
      ["🙏", "pray thanks please"],
      ["✍️", "writing"],
      ["💪", "muscle strong"],
      ["🦾", "mechanical arm"],
      ["👊", "fist bump"],
      ["✊", "raised fist"],
      ["🤛", "left fist"],
      ["🤜", "right fist"],
      ["🫶", "heart hands"],
      ["🫡", "salute"],
      ["🤲", "palms up"],
    ],
  },
  {
    id: "hearts",
    items: [
      ["❤️", "red heart love"],
      ["🧡", "orange heart"],
      ["💛", "yellow heart"],
      ["💚", "green heart"],
      ["💙", "blue heart"],
      ["💜", "purple heart"],
      ["🖤", "black heart"],
      ["🤍", "white heart"],
      ["🤎", "brown heart"],
      ["💔", "broken heart"],
      ["❣️", "heart exclamation"],
      ["💕", "two hearts"],
      ["💞", "revolving hearts"],
      ["💓", "beating heart"],
      ["💗", "growing heart"],
      ["💖", "sparkling heart"],
      ["💘", "cupid arrow heart"],
      ["💝", "heart gift"],
      ["💟", "heart decoration"],
      ["♥️", "heart suit"],
      ["💯", "hundred perfect"],
      ["💢", "anger"],
      ["💥", "collision boom"],
      ["💫", "dizzy stars"],
      ["💦", "sweat drops"],
      ["💨", "dash wind"],
    ],
  },
  {
    id: "objects",
    items: [
      ["🎉", "party tada celebrate"],
      ["🎊", "confetti"],
      ["🎈", "balloon"],
      ["🎁", "gift present"],
      ["🏆", "trophy win"],
      ["🥇", "gold medal first"],
      ["🎯", "target dart"],
      ["🔥", "fire lit hot"],
      ["⭐", "star"],
      ["🌟", "glowing star"],
      ["✨", "sparkles"],
      ["⚡", "lightning zap"],
      ["💡", "idea bulb"],
      ["📌", "pin"],
      ["📎", "paperclip"],
      ["✅", "check done"],
      ["❌", "cross no"],
      ["📷", "camera photo"],
      ["🎥", "movie camera"],
      ["🎬", "clapper film"],
      ["🎵", "music note"],
      ["🎶", "music notes"],
      ["🎧", "headphones"],
      ["🎮", "game controller"],
      ["📱", "phone mobile"],
      ["💻", "laptop computer"],
      ["⌨️", "keyboard"],
      ["🖥️", "desktop"],
      ["💰", "money bag"],
      ["💵", "dollar cash"],
      ["📚", "books"],
      ["✏️", "pencil write"],
      ["📝", "memo note"],
      ["📅", "calendar date"],
      ["⏰", "alarm clock"],
      ["🔔", "bell notify"],
      ["🔒", "lock secure"],
      ["🔑", "key"],
      ["☕", "coffee"],
      ["🍕", "pizza"],
      ["🍔", "burger"],
      ["🍟", "fries"],
      ["🍿", "popcorn"],
      ["🎂", "cake birthday"],
      ["🍺", "beer"],
      ["🍻", "cheers beer"],
      ["🥂", "champagne cheers"],
      ["🚀", "rocket launch"],
      ["🌍", "earth globe world"],
    ],
  },
  {
    id: "symbols",
    items: [
      ["✔️", "check mark"],
      ["➕", "plus add"],
      ["➖", "minus"],
      ["➗", "divide"],
      ["✖️", "multiply"],
      ["♾️", "infinity"],
      ["‼️", "double exclamation"],
      ["❓", "question"],
      ["❔", "white question"],
      ["❗", "exclamation"],
      ["⁉️", "interrobang"],
      ["⚠️", "warning caution"],
      ["🚫", "no prohibited"],
      ["✅", "check green"],
      ["🆗", "ok button"],
      ["🆕", "new"],
      ["🔝", "top up"],
      ["🔙", "back"],
      ["🔜", "soon"],
      ["♻️", "recycle"],
      ["✳️", "asterisk"],
      ["❇️", "sparkle"],
      ["©️", "copyright"],
      ["®️", "registered"],
      ["™️", "trademark"],
      ["🔴", "red circle"],
      ["🟠", "orange circle"],
      ["🟡", "yellow circle"],
      ["🟢", "green circle"],
      ["🔵", "blue circle"],
      ["🟣", "purple circle"],
      ["⚫", "black circle"],
      ["⚪", "white circle"],
    ],
  },
];

export default function EmojiPicker({ onSelect }: { onSelect: (emoji: string) => void }) {
  const t = useT();
  const [q, setQ] = useState("");

  const results = useMemo(() => {
    const query = q.trim().toLowerCase();
    if (!query) return null;
    const hits: string[] = [];
    for (const g of GROUPS) {
      for (const [e, name] of g.items) {
        if (name.includes(query)) hits.push(e);
      }
    }
    return hits;
  }, [q]);

  return (
    <div className="flex w-72 flex-col gap-2 rounded-2xl border border-yt-outline bg-yt-menu p-3">
      <input
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder={t("thread.emoji.search")}
        className="h-9 w-full rounded-full border border-yt-searchborder bg-yt-base px-4 text-sm text-yt-text outline-none placeholder:text-yt-text2"
      />
      <div className="max-h-64 overflow-y-auto">
        {results ? (
          results.length ? (
            <div className="grid grid-cols-7 gap-1">
              {results.map((e, i) => (
                <button
                  key={`${e}-${i}`}
                  type="button"
                  onClick={() => onSelect(e)}
                  className="rounded-lg p-1 text-xl hover:bg-yt-hover"
                >
                  {e}
                </button>
              ))}
            </div>
          ) : (
            <p className="py-6 text-center text-sm text-yt-text2">{t("thread.emoji.empty")}</p>
          )
        ) : (
          GROUPS.map((g) => (
            <div key={g.id} className="mb-2">
              <p className="px-1 py-1 text-xs font-medium text-yt-text2">
                {t(`thread.emoji.cat.${g.id}`)}
              </p>
              <div className="grid grid-cols-7 gap-1">
                {g.items.map(([e], i) => (
                  <button
                    key={`${e}-${i}`}
                    type="button"
                    onClick={() => onSelect(e)}
                    className="rounded-lg p-1 text-xl hover:bg-yt-hover"
                  >
                    {e}
                  </button>
                ))}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
