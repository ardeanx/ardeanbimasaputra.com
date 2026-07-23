import { redirect } from "next/navigation";

export default function CategoriesRedirect() {
  redirect("/studio/content?view=kategori");
}
