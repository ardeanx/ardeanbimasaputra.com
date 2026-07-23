import { redirect } from "next/navigation";

export default async function Kategori({ params }: { params: Promise<{ kategori: string }> }) {
  const { kategori } = await params;
  redirect(`/?c=${kategori}`);
}
