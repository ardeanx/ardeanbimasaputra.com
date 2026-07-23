"use client";

import {
  type ColumnDef,
  type RowSelectionState,
  type SortingState,
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { useVirtualizer } from "@tanstack/react-virtual";
import {
  ArrowDown,
  ArrowUp,
  Eye,
  EyeOff,
  Globe,
  ListFilter,
  Lock,
  Pencil,
  Search,
  Trash2,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useRef, useState, useTransition } from "react";
import { toast } from "sonner";
import {
  bulkDeleteAction,
  bulkVisibilityAction,
  setVisibilityAction,
} from "@/app/(studio)/studio/content/actions";
import { useFmt, useT } from "@/components/i18n/I18nProvider";
import Select from "@/components/ui/Select";
import { askConfirm } from "@/components/ui/dialog";

export type ContentRow = {
  id: string;
  title: string;
  excerpt: string | null;
  thumbnail: string | null;
  type: "VIDEO" | "AUDIO" | "POST" | "RESOURCE";
  status: string;
  visibility: "PUBLIC" | "UNLISTED" | "PRIVATE";
  viewCount: number;
  commentCount: number;
  updatedAt: string;
  publishedAt: string | null;
  authorName: string | null;
};

type Visibility = ContentRow["visibility"];

const TABS = [
  { key: "ALL", labelKey: "studio.content.tabAll" },
  { key: "VIDEO", labelKey: "studio.content.typeVideo" },
  { key: "AUDIO", labelKey: "studio.content.typeAudio" },
  { key: "POST", labelKey: "studio.content.typePost" },
  { key: "RESOURCE", labelKey: "studio.content.typeResource" },
] as const;

const TYPE_LABEL_KEYS: Record<ContentRow["type"], string> = {
  VIDEO: "studio.content.typeVideo",
  AUDIO: "studio.content.typeAudio",
  POST: "studio.content.typePostLong",
  RESOURCE: "studio.content.typeResource",
};

const STATUS: Record<string, { labelKey: string; cls: string }> = {
  DRAFT: { labelKey: "studio.content.statusDraft", cls: "bg-yt-chip text-yt-text2" },
  REVIEW: {
    labelKey: "studio.content.statusReview",
    cls: "bg-amber-500/15 text-amber-600 dark:text-amber-400",
  },
  PUBLISHED: {
    labelKey: "studio.content.statusPublished",
    cls: "bg-green-500/15 text-green-600 dark:text-green-400",
  },
  REJECTED: { labelKey: "studio.content.statusRejected", cls: "bg-red-500/15 text-red-500" },
  ARCHIVED: { labelKey: "studio.content.statusArchived", cls: "bg-yt-chip text-yt-text2" },
};

const VIS_META: Record<Visibility, { labelKey: string; Icon: typeof Globe }> = {
  PUBLIC: { labelKey: "studio.content.visPublic", Icon: Globe },
  UNLISTED: { labelKey: "studio.content.visUnlisted", Icon: EyeOff },
  PRIVATE: { labelKey: "studio.content.visPrivate", Icon: Lock },
};

const GRID =
  "grid grid-cols-[36px_minmax(0,1fr)_160px_130px_92px_92px_88px] items-center gap-3 px-3";

function VisibilitySelect({
  id,
  value,
  onSynced,
}: {
  id: string;
  value: Visibility;
  onSynced: () => void;
}) {
  const t = useT();
  const [vis, setVis] = useState<Visibility>(value);
  const [pending, start] = useTransition();

  function change(next: Visibility) {
    if (next === vis) return;
    const prev = vis;
    setVis(next);
    start(async () => {
      const res = await setVisibilityAction(id, next);
      if ("error" in res) {
        setVis(prev);
        toast.error(res.error);
      } else {
        toast.success(
          t("studio.content.visibilitySet", {
            visibility: t(VIS_META[next].labelKey),
          }),
        );
        onSynced();
      }
    });
  }

  return (
    <Select
      ariaLabel={t("studio.content.changeVisibility")}
      value={vis}
      disabled={pending}
      onChange={(v) => change(v as Visibility)}
      options={(Object.keys(VIS_META) as Visibility[]).map((v) => {
        const M = VIS_META[v];
        return {
          value: v,
          label: t(M.labelKey),
          icon: <M.Icon size={14} className="shrink-0 text-yt-text2" />,
        };
      })}
      buttonClassName="flex h-8 w-full items-center gap-1.5 rounded-full px-2.5 text-xs hover:bg-yt-hover disabled:opacity-50"
      menuClassName="w-44"
    ></Select>
  );
}

function SortHeader({
  label,
  sorted,
  onClick,
  right,
}: {
  label: string;
  sorted: false | "asc" | "desc";
  onClick: () => void;
  right?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`group/sort flex items-center gap-1 rounded px-1 py-0.5 hover:bg-yt-hover hover:text-yt-text ${
        right ? "ml-auto" : ""
      } ${sorted ? "text-yt-text" : ""}`}
    >
      {label}
      {sorted === "asc" ? (
        <ArrowUp size={13} />
      ) : sorted === "desc" ? (
        <ArrowDown size={13} />
      ) : (
        <ArrowDown size={13} className="opacity-0 group-hover/sort:opacity-40" />
      )}
    </button>
  );
}

export default function ContentTable({
  rows,
  initialTab,
  initialQuery,
}: {
  rows: ContentRow[];
  initialTab: string;
  initialQuery: string;
}) {
  const t = useT();
  const fmt = useFmt();
  const router = useRouter();
  const [tab, setTab] = useState<string>(
    TABS.some((tb) => tb.key === initialTab) ? initialTab : "ALL",
  );
  const [query, setQuery] = useState(initialQuery);
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [visFilter, setVisFilter] = useState("ALL");
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});
  const [sorting, setSorting] = useState<SortingState>([{ id: "date", desc: true }]);
  const [pending, start] = useTransition();
  const scrollRef = useRef<HTMLDivElement>(null);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return rows.filter((r) => {
      if (tab !== "ALL" && r.type !== tab) return false;
      if (statusFilter !== "ALL" && r.status !== statusFilter) return false;
      if (visFilter !== "ALL" && r.visibility !== visFilter) return false;
      if (q && !r.title.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [rows, tab, query, statusFilter, visFilter]);

  const columns = useMemo<ColumnDef<ContentRow>[]>(
    () => [
      {
        id: "select",
        enableSorting: false,
        header: ({ table }) => (
          <input
            type="checkbox"
            aria-label={t("studio.content.selectAll")}
            className="h-4 w-4 accent-[var(--yt-cta)]"
            checked={table.getIsAllRowsSelected()}
            ref={(el) => {
              if (el) el.indeterminate = table.getIsSomeRowsSelected();
            }}
            onChange={table.getToggleAllRowsSelectedHandler()}
          />
        ),
        cell: ({ row }) => (
          <input
            type="checkbox"
            aria-label={t("studio.content.selectRow")}
            className="h-4 w-4 accent-[var(--yt-cta)]"
            checked={row.getIsSelected()}
            onChange={row.getToggleSelectedHandler()}
          />
        ),
      },
      {
        id: "content",
        enableSorting: false,
        header: () => <span>{t("studio.content.colContent")}</span>,
        cell: ({ row }) => {
          const r = row.original;
          const s = STATUS[r.status];
          return (
            <div className="group/row flex min-w-0 items-center gap-3 py-2.5">
              <span className="relative block aspect-video w-[110px] shrink-0 overflow-hidden rounded-lg bg-yt-hover">
                {r.thumbnail && (
                  <img src={r.thumbnail} alt="" className="h-full w-full object-cover" />
                )}
              </span>
              <span className="min-w-0 flex-1">
                <span className="flex items-center gap-2">
                  <Link
                    href={`/studio/${r.id}`}
                    className="line-clamp-1 text-sm font-medium hover:text-yt-cta"
                  >
                    {r.title || t("studio.content.untitled")}
                  </Link>
                  <span
                    className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-medium ${s?.cls ?? ""}`}
                  >
                    {s ? t(s.labelKey) : r.status}
                  </span>
                </span>
                <span className="mt-0.5 line-clamp-1 text-xs text-yt-text2">
                  {r.excerpt || t(TYPE_LABEL_KEYS[r.type])}
                </span>
                <span className="mt-1 flex items-center gap-1 opacity-0 transition-opacity group-hover/row:opacity-100">
                  <Link
                    href={`/studio/${r.id}`}
                    aria-label={t("studio.content.edit")}
                    title={t("studio.content.edit")}
                    className="grid h-7 w-7 place-items-center rounded-full hover:bg-yt-hover"
                  >
                    <Pencil size={15} />
                  </Link>
                  {r.status === "PUBLISHED" && (
                    <Link
                      href={`/watch?v=${r.id}`}
                      aria-label={t("studio.content.view")}
                      title={t("studio.content.viewOnSite")}
                      className="grid h-7 w-7 place-items-center rounded-full hover:bg-yt-hover"
                    >
                      <Eye size={15} />
                    </Link>
                  )}
                  <button
                    type="button"
                    aria-label={t("common.delete")}
                    title={t("common.delete")}
                    onClick={() => deleteOne(r.id, r.title)}
                    className="grid h-7 w-7 place-items-center rounded-full text-red-500 hover:bg-yt-hover"
                  >
                    <Trash2 size={15} />
                  </button>
                </span>
              </span>
            </div>
          );
        },
      },
      {
        id: "visibility",
        enableSorting: false,
        header: () => <span>{t("studio.content.colVisibility")}</span>,
        cell: ({ row }) => (
          <VisibilitySelect
            id={row.original.id}
            value={row.original.visibility}
            onSynced={() => router.refresh()}
          />
        ),
      },
      {
        id: "date",
        accessorFn: (r) => new Date(r.publishedAt ?? r.updatedAt).getTime(),
        header: ({ column }) => (
          <SortHeader
            label={t("studio.content.colDate")}
            sorted={column.getIsSorted()}
            onClick={() => column.toggleSorting(column.getIsSorted() !== "desc")}
          />
        ),
        cell: ({ row }) => (
          <span className="text-xs text-yt-text2" suppressHydrationWarning>
            {fmt.ago(new Date(row.original.publishedAt ?? row.original.updatedAt))}
          </span>
        ),
      },
      {
        id: "views",
        accessorFn: (r) => r.viewCount,
        header: ({ column }) => (
          <SortHeader
            right
            label={t("studio.content.colViews")}
            sorted={column.getIsSorted()}
            onClick={() => column.toggleSorting(column.getIsSorted() !== "desc")}
          />
        ),
        cell: ({ row }) => (
          <span className="block text-right text-sm">{fmt.compact(row.original.viewCount)}</span>
        ),
      },
      {
        id: "comments",
        accessorFn: (r) => r.commentCount,
        header: ({ column }) => (
          <SortHeader
            right
            label={t("studio.content.colComments")}
            sorted={column.getIsSorted()}
            onClick={() => column.toggleSorting(column.getIsSorted() !== "desc")}
          />
        ),
        cell: ({ row }) => (
          <span className="block text-right text-sm">{fmt.compact(row.original.commentCount)}</span>
        ),
      },
      {
        id: "author",
        enableSorting: false,
        header: () => <span>{t("studio.content.colAuthor")}</span>,
        cell: ({ row }) => (
          <span className="line-clamp-1 text-xs text-yt-text2">
            {row.original.authorName ?? "—"}
          </span>
        ),
      },
    ],
    [t, fmt, router],
  );

  const table = useReactTable({
    data: filtered,
    columns,
    state: { rowSelection, sorting },
    enableRowSelection: true,
    onRowSelectionChange: setRowSelection,
    onSortingChange: setSorting,
    getRowId: (r) => r.id,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
  });

  const modelRows = table.getRowModel().rows;
  const virtualizer = useVirtualizer({
    count: modelRows.length,
    getScrollElement: () => scrollRef.current,
    estimateSize: () => 88,
    overscan: 8,
  });

  const visibleIds = useMemo(() => new Set(filtered.map((r) => r.id)), [filtered]);
  const selectedIds = Object.keys(rowSelection).filter((k) => rowSelection[k] && visibleIds.has(k));

  function dropSelection(id: string) {
    setRowSelection((cur) => {
      if (!cur[id]) return cur;
      const next = { ...cur };
      delete next[id];
      return next;
    });
  }

  function deleteOne(id: string, title: string) {
    askConfirm({
      title: t("studio.content.deleteOneTitle"),
      body: t("studio.content.deleteOneBody", { title }),
      confirmLabel: t("common.delete"),
      danger: true,
    }).then((ok) => {
      if (!ok) return;
      start(async () => {
        const res = await bulkDeleteAction([id]);
        if ("error" in res) toast.error(res.error);
        else {
          toast.success(t("studio.content.deletedOne"));
          dropSelection(id);
          router.refresh();
        }
      });
    });
  }

  function bulkDelete() {
    if (selectedIds.length === 0) return;
    askConfirm({
      title: t("studio.content.bulkDeleteTitle", { count: selectedIds.length }),
      body: t("studio.content.bulkDeleteBody"),
      confirmLabel: t("studio.content.deleteAll"),
      danger: true,
    }).then((ok) => {
      if (!ok) return;
      start(async () => {
        const res = await bulkDeleteAction(selectedIds);
        if ("error" in res) toast.error(res.error);
        else {
          toast.success(t("studio.content.bulkDeleted", { count: res.deleted }));
          setRowSelection({});
          router.refresh();
        }
      });
    });
  }

  function bulkVisibility(v: Visibility) {
    if (selectedIds.length === 0) return;
    start(async () => {
      const res = await bulkVisibilityAction(selectedIds, v);
      if ("error" in res) toast.error(res.error);
      else {
        toast.success(
          t("studio.content.bulkVisibility", {
            count: res.updated,
            visibility: t(VIS_META[v].labelKey),
          }),
        );
        setRowSelection({});
        router.refresh();
      }
    });
  }

  const headerGroup = table.getHeaderGroups()[0];

  return (
    <div className="flex flex-col">
      <div className="mb-3 flex flex-wrap items-center gap-2">
        {TABS.map((tb) => (
          <button
            key={tb.key}
            type="button"
            onClick={() => setTab(tb.key)}
            className={`h-8 rounded-full px-3.5 text-sm font-medium ${
              tab === tb.key
                ? "bg-yt-text text-yt-base"
                : "bg-yt-chip text-yt-text hover:bg-yt-chip-hover"
            }`}
          >
            {t(tb.labelKey)}
          </button>
        ))}
      </div>

      <div className="mb-1 flex flex-wrap items-center gap-2 border-b border-yt-outline pb-3">
        <span className="flex items-center gap-1.5 text-sm text-yt-text2">
          <ListFilter size={16} /> {t("studio.content.filter")}
        </span>
        <Select
          ariaLabel={t("studio.content.filterStatus")}
          value={statusFilter}
          onChange={setStatusFilter}
          options={[
            { value: "ALL", label: t("studio.content.allStatuses") },
            ...Object.entries(STATUS).map(([v, m]) => ({
              value: v,
              label: t(m.labelKey),
            })),
          ]}
          buttonClassName="flex h-8 items-center gap-1.5 rounded-full bg-yt-chip px-3 text-sm hover:bg-yt-chip-hover"
          menuClassName="w-44"
          className="w-auto"
        />
        <Select
          ariaLabel={t("studio.content.filterVisibility")}
          value={visFilter}
          onChange={setVisFilter}
          options={[
            { value: "ALL", label: t("studio.content.allVisibilities") },
            ...(Object.keys(VIS_META) as Visibility[]).map((v) => ({
              value: v,
              label: t(VIS_META[v].labelKey),
            })),
          ]}
          buttonClassName="flex h-8 items-center gap-1.5 rounded-full bg-yt-chip px-3 text-sm hover:bg-yt-chip-hover"
          menuClassName="w-48"
          className="w-auto"
        />
        <div className="ml-auto flex h-9 w-60 items-center gap-2 rounded-full border border-yt-outline px-3.5 focus-within:border-yt-cta">
          <Search size={15} className="shrink-0 text-yt-text2" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t("studio.content.searchTitle")}
            className="h-full w-full bg-transparent text-sm outline-none placeholder:text-yt-text2"
          />
        </div>
      </div>

      {selectedIds.length > 0 && (
        <div className="mb-2 mt-2 flex items-center gap-2 rounded-xl bg-yt-chip px-4 py-2 text-sm">
          <span className="font-medium">
            {t("studio.content.selected", { count: selectedIds.length })}
          </span>
          <div className="ml-auto flex items-center gap-2">
            {(Object.keys(VIS_META) as Visibility[]).map((v) => (
              <button
                key={v}
                type="button"
                disabled={pending}
                onClick={() => bulkVisibility(v)}
                className="rounded-full bg-yt-base px-3 py-1 text-xs font-medium hover:bg-yt-hover disabled:opacity-50"
              >
                {t(VIS_META[v].labelKey)}
              </button>
            ))}
            <button
              type="button"
              disabled={pending}
              onClick={bulkDelete}
              className="rounded-full bg-red-500/15 px-3 py-1 text-xs font-medium text-red-500 hover:bg-red-500/25 disabled:opacity-50"
            >
              {t("common.delete")}
            </button>
          </div>
        </div>
      )}

      <div className={`${GRID} h-11 border-b border-yt-outline text-xs font-medium text-yt-text2`}>
        {headerGroup.headers.map((h) => (
          <div key={h.id} className="min-w-0">
            {flexRender(h.column.columnDef.header, h.getContext())}
          </div>
        ))}
      </div>

      {modelRows.length === 0 ? (
        <p className="py-16 text-center text-sm text-yt-text2">{t("studio.content.emptyFilter")}</p>
      ) : (
        <div ref={scrollRef} className="max-h-[calc(100vh-19rem)] overflow-y-auto">
          <div style={{ height: `${virtualizer.getTotalSize()}px` }} className="relative w-full">
            {virtualizer.getVirtualItems().map((vi) => {
              const row = modelRows[vi.index];
              return (
                <div
                  key={row.id}
                  data-index={vi.index}
                  ref={virtualizer.measureElement}
                  style={{ transform: `translateY(${vi.start}px)` }}
                  className={`absolute left-0 top-0 w-full ${GRID} border-b border-yt-outline/60 ${
                    row.getIsSelected() ? "bg-yt-hover" : "hover:bg-yt-hover/60"
                  }`}
                >
                  {row.getVisibleCells().map((cell) => (
                    <div key={cell.id} className="min-w-0">
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </div>
                  ))}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
