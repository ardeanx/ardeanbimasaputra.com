import type { EditorView } from "@tiptap/pm/view";
import { toast } from "sonner";

export async function uploadImage(file: File): Promise<{ url: string } | { error: string }> {
  const form = new FormData();
  form.append("file", file);
  try {
    const r = await fetch("/api/uploads", { method: "POST", body: form });
    const data = (await r.json().catch(() => ({}))) as {
      url?: string;
      error?: string;
    };
    if (!r.ok || !data.url) {
      return { error: data.error ?? "Gagal mengunggah gambar." };
    }
    return { url: data.url };
  } catch {
    return { error: "Gagal mengunggah gambar." };
  }
}

export function insertImageFiles(
  view: EditorView,
  files: FileList | null | undefined,
  pos?: number,
): boolean {
  const images = Array.from(files ?? []).filter((f) => f.type.startsWith("image/"));
  if (images.length === 0) return false;
  void (async () => {
    let at = pos;
    for (const file of images) {
      const res = await uploadImage(file);
      if ("error" in res) {
        toast.error(res.error);
        continue;
      }
      const node = view.state.schema.nodes.image.create({ src: res.url });
      const tr =
        at != null
          ? view.state.tr.insert(Math.min(at, view.state.doc.content.size), node)
          : view.state.tr.replaceSelectionWith(node);
      view.dispatch(tr);
      if (at != null) at += node.nodeSize;
    }
  })();
  return true;
}
