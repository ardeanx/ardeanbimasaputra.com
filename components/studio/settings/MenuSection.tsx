"use client";

import { ChevronDown, ChevronUp, Plus, Trash2 } from "lucide-react";
import { forwardRef, useImperativeHandle, useState } from "react";
import { toast } from "sonner";
import { saveSettingsAction } from "@/app/(studio)/studio/settings/actions";
import { useT } from "@/components/i18n/I18nProvider";
import Select from "@/components/ui/Select";
import type { AppSettings } from "@/lib/settings";
import IconPicker from "./IconPicker";
import { GroupTitle, Toggle, inputCls, type SaveHandle } from "./forms";

type Menu = AppSettings["menu"];
type Item = Menu["items"][number];
type Section = Item["section"];

const SECTIONS: Section[] = ["top", "explore", "bottom"];

let counter = 0;
function newId() {
  counter += 1;
  return `m${Date.now()}${counter}`;
}

function move(items: Item[], id: string, dir: -1 | 1): Item[] {
  const item = items.find((i) => i.id === id);
  if (!item) return items;
  const siblings = items.filter((i) => i.section === item.section);
  const pos = siblings.findIndex((i) => i.id === id);
  const swap = siblings[pos + dir];
  if (!swap) return items;
  return items.map((i) => (i.id === id ? swap : i.id === swap.id ? item : i));
}

function ItemEditor({
  item,
  onChange,
  onRemove,
  onMove,
}: {
  item: Item;
  onChange: (v: Item) => void;
  onRemove: () => void;
  onMove: (dir: -1 | 1) => void;
}) {
  const t = useT();
  return (
    <div className="rounded-xl border border-yt-outline p-3">
      <div className="flex items-start gap-3">
        <div className="min-w-0 flex-1 space-y-2">
          <input
            value={item.label}
            placeholder={t("settings.menu.label")}
            aria-label={t("settings.menu.label")}
            maxLength={60}
            onChange={(e) => onChange({ ...item, label: e.target.value })}
            className={inputCls}
          />
          <input
            value={item.url}
            placeholder={t("settings.menu.url")}
            aria-label={t("settings.menu.url")}
            maxLength={300}
            onChange={(e) => onChange({ ...item, url: e.target.value })}
            className={inputCls}
          />
          <div className="flex items-center gap-3">
            <Select
              ariaLabel={t("settings.menu.section")}
              className="w-36"
              value={item.section}
              onChange={(v) => onChange({ ...item, section: v as Section })}
              options={SECTIONS.map((s) => ({
                value: s,
                label: t(`settings.menu.section.${s}`),
              }))}
            />
            <label className="flex items-center gap-2 text-sm text-yt-text2">
              <Toggle
                ariaLabel={t("settings.menu.newTab")}
                checked={item.newTab}
                onChange={(v) => onChange({ ...item, newTab: v })}
              />
              {t("settings.menu.newTab")}
            </label>
          </div>
        </div>
        <div className="w-52 shrink-0">
          <IconPicker
            value={{ icon: item.icon, iconType: item.iconType }}
            onChange={(v) => onChange({ ...item, icon: v.icon, iconType: v.iconType })}
          />
        </div>
      </div>
      <div className="mt-2 flex justify-end gap-1">
        <button
          type="button"
          aria-label={t("settings.menu.moveUp")}
          onClick={() => onMove(-1)}
          className="grid h-8 w-8 place-items-center rounded-full text-yt-text2 hover:bg-yt-hover"
        >
          <ChevronUp size={16} />
        </button>
        <button
          type="button"
          aria-label={t("settings.menu.moveDown")}
          onClick={() => onMove(1)}
          className="grid h-8 w-8 place-items-center rounded-full text-yt-text2 hover:bg-yt-hover"
        >
          <ChevronDown size={16} />
        </button>
        <button
          type="button"
          aria-label={t("settings.menu.remove")}
          onClick={onRemove}
          className="grid h-8 w-8 place-items-center rounded-full text-yt-text2 hover:bg-yt-hover hover:text-red-500"
        >
          <Trash2 size={16} />
        </button>
      </div>
    </div>
  );
}

const MenuSection = forwardRef<SaveHandle, { menu: Menu }>(function MenuSection({ menu }, ref) {
  const t = useT();
  const [items, setItems] = useState<Item[]>(menu.items);

  function update(id: string, v: Item) {
    setItems((p) => p.map((i) => (i.id === id ? v : i)));
  }
  function remove(id: string) {
    setItems((p) => p.filter((i) => i.id !== id));
  }
  function add(section: Section) {
    setItems((p) => [
      ...p,
      {
        id: newId(),
        label: "",
        icon: "",
        iconType: "lucide",
        url: "",
        section,
        newTab: false,
      },
    ]);
  }

  async function save() {
    const clean = items.filter((i) => i.label.trim() && i.url.trim());
    const res = await saveSettingsAction({ menu: { items: clean } });
    if ("error" in res) {
      toast.error(res.error);
      return false;
    }
    return true;
  }
  useImperativeHandle(ref, () => ({ save }));

  return (
    <div className="min-h-0 flex-1 overflow-y-auto px-8 py-5">
      <p className="pb-2 text-xs text-yt-text2">{t("settings.menu.desc")}</p>
      {SECTIONS.map((section) => {
        const group = items.filter((i) => i.section === section);
        return (
          <div key={section}>
            <GroupTitle>{t(`settings.menu.section.${section}`)}</GroupTitle>
            <div className="space-y-2">
              {group.map((item) => (
                <ItemEditor
                  key={item.id}
                  item={item}
                  onChange={(v) => update(item.id, v)}
                  onRemove={() => remove(item.id)}
                  onMove={(dir) => setItems((p) => move(p, item.id, dir))}
                />
              ))}
            </div>
            <button
              type="button"
              onClick={() => add(section)}
              className="mt-2 flex h-9 items-center gap-2 rounded-full border border-yt-outline px-4 text-sm font-medium hover:bg-yt-hover"
            >
              <Plus size={16} />
              {t("settings.menu.addItem")}
            </button>
          </div>
        );
      })}
    </div>
  );
});

export default MenuSection;
