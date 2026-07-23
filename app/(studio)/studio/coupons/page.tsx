import { redirect } from "next/navigation";

export default function CouponsRedirect() {
  redirect("/studio/produk?view=kupon");
}
