import type { category, post, user } from "@/db/schema";

export type DetailPost = typeof post.$inferSelect & {
  author: typeof user.$inferSelect;
  category: typeof category.$inferSelect | null;
};
