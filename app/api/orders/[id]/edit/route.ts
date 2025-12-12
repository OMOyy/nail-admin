// /app/api/orders/[id]/edit/route.ts
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
} from "@aws-sdk/client-s3";
import { getServerSupabase } from "@/lib/serverSupabase"
// ---------------- R2 Client ----------------
const r2 = new S3Client({
  region: "auto",
  endpoint: process.env.R2_ENDPOINT_URL!,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID!,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
  },
});

// ---------------- Supabase (server role) ----------------

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {

  const { id } = await params
  console.log("🔥 HIT /api/orders/[id]/edit", id);
  const form = await req.formData();

  // ① 前端 JSON
  const json = JSON.parse(form.get("data") as string);

  // ② 舊圖片（URL）
  const oldImages = form.getAll("oldImages") as string[];

  // ③ 新圖片（File）
  const newFiles = form.getAll("newImages") as File[];

  const supabase = getServerSupabase()

  // ④ 讀取資料庫原本圖片
  const { data: exist, error: fetchErr } = await supabase
    .from("orders")
    .select("style_imgs")
    .eq("id", id)
    .single();

  if (fetchErr) {
    return NextResponse.json({ success: false, error: fetchErr.message });
  }

  const existingUrls: string[] = exist?.style_imgs || [];

  // ⑤ 刪除被移除的圖片
  const toDelete = existingUrls.filter((url) => !oldImages.includes(url));

  for (const url of toDelete) {
    const key = url.replace(process.env.R2_PUBLIC_URL + "/", "");
    if (!key) continue;

    await r2.send(
      new DeleteObjectCommand({
        Bucket: process.env.R2_BUCKET_NAME!,
        Key: key,
      })
    );
  }

  // ⑥ 上傳新圖片
  const newUrls: string[] = [];

  for (const file of newFiles) {
    const buffer = Buffer.from(await file.arrayBuffer());
    const ext = file.name.split(".").pop() ?? "jpg";
    const filename = `order-${id}-${Date.now()}-${Math.random()}.${ext}`;

    await r2.send(
      new PutObjectCommand({
        Bucket: process.env.R2_BUCKET_NAME!,
        Key: filename,
        Body: buffer,
        ContentType: file.type,
      })
    );

    newUrls.push(`${process.env.R2_PUBLIC_URL}/${filename}`);
  }

  // ⑦ 最終圖片列表
  const finalImageList = [...oldImages, ...newUrls];

  // ⑧ 白名單欄位
  const allowed = {
    customer: json.customer ?? null,
    size: json.size ?? null,
    shape: json.shape ?? null,
    custom_size_note: json.custom_size_note ?? null,
    quantity: json.quantity ?? null,
    price: json.price ?? null,
    note: json.note ?? null,
    status: json.status ?? null,
    style_imgs: finalImageList,
  };

  // ⑨ 更新資料
  const { error: updateErr } = await supabase
    .from("orders")
    .update(allowed)
    .eq("id", id);

  if (updateErr) {
    return NextResponse.json({ success: false, error: updateErr.message });
  }

  return NextResponse.json({ success: true });
}
