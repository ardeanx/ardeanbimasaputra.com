import { revalidatePath } from "next/cache";

export function revalidateContent(): void {
  revalidatePath("/", "layout");
  for (const p of ["/", "/watch", "/store", "/resources", "/studio", "/studio/content"]) {
    revalidatePath(p);
  }
}
