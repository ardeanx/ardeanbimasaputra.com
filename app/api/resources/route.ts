import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { post, product } from "@/db/schema";
import { db } from "@/lib/db";
import { addResourceFile, type FileOwner, listResourceFiles } from "@/lib/resources";
import { getSession } from "@/lib/session";

export async function POST(req: Request) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Harus masuk." }, { status: 401 });
  }

  const form = await req.formData().catch(() => null);
  const postId = String(form?.get("postId") ?? "");
  const productId = String(form?.get("productId") ?? "");
  const file = form?.get("file");
  if ((!postId && !productId) || !(file instanceof File)) {
    return NextResponse.json({ error: "Data tidak lengkap." }, { status: 400 });
  }

  const role = (session.user as { role?: string | null }).role ?? null;
  let owner: FileOwner;
  if (productId) {
    const pr = await db.query.product.findFirst({
      where: eq(product.id, productId),
    });
    if (!pr) {
      return NextResponse.json({ error: "Produk tidak ditemukan." }, { status: 404 });
    }
    if (pr.ownerId !== session.user.id && role !== "admin") {
      return NextResponse.json({ error: "Tidak berhak." }, { status: 403 });
    }
    owner = { productId };
  } else {
    const p = await db.query.post.findFirst({ where: eq(post.id, postId) });
    if (!p) {
      return NextResponse.json({ error: "Konten tidak ditemukan." }, { status: 404 });
    }
    if (p.authorId !== session.user.id && role !== "admin") {
      return NextResponse.json({ error: "Tidak berhak." }, { status: 403 });
    }
    owner = { postId };
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const res = await addResourceFile(owner, file.name, buffer);
  if ("error" in res) {
    return NextResponse.json({ error: res.error }, { status: 400 });
  }

  const files = await listResourceFiles(owner);
  return NextResponse.json({ files }, { status: 201 });
}
