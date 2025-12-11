import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
} from "@aws-sdk/client-s3";

// ---------------- R2 Client ----------------
const r2 = new S3Client({
  region: "auto",
  endpoint: process.env.R2_ENDPOINT_URL!,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID!,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
  },
});

// ---------------- Supabase ----------------
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_KEY!
);

export async function POST(req: Request, { params }: { params: { id: string } }) {
  const id = params.id;
  const form = await req.formData();

  /** ① 前端傳來的資料 */
  const json = JSON.parse(form.get("data") as string);

  /** 移除前端不該更新的欄位 */
  delete json.id;
  delete json.created_at;
  delete json.updated_at;
  delete json.style_imgs;

  /** ② 舊圖片（前端保留的） */
  const oldImages = form.getAll("oldImages") as string[];

  /** ③ 新圖片 */
  const newFiles = form.getAll("newImages") as File[];

  // ---------------------------------------------------
  // ④ 從資料庫抓出原始圖片
  // ---------------------------------------------------
  const { data: exist } = await supabase
    .from("orders")
    .select("style_imgs")
    .eq("id", id)
    .single();

  const existingUrls: string[] = exist?.style_imgs || [];

  // 計算需要刪除的圖片
  const toDelete = existingUrls.filter((url) => !oldImages.includes(url));

  // ---------------------------------------------------
  // ⑤ 刪除 R2 中不保留的圖片
  // ---------------------------------------------------
  for (const url of toDelete) {
    const key = url.split("/").pop();
    if (!key) continue;

    await r2.send(
      new DeleteObjectCommand({
        Bucket: process.env.R2_BUCKET_NAME!,
        Key: key,
      })
    );
  }

  // ---------------------------------------------------
  // ⑥ 上傳新增圖片
  // ---------------------------------------------------
  const newUrls: string[] = [];

  for (const file of newFiles) {
    const buffer = Buffer.from(await file.arrayBuffer());
    const ext = file.type.split("/")[1] || "jpg";
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

  // ---------------------------------------------------
  // ⑦ 組合最終圖片列表
  // ---------------------------------------------------
  const finalImageList = [...oldImages, ...newUrls];

  // ---------------------------------------------------
  // ⑧ 白名單欄位（絕對安全）
  // ---------------------------------------------------
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

  // ---------------------------------------------------
  // ⑨ 進行唯一一次 UPDATE（完全安全）
  // ---------------------------------------------------
  const { error } = await supabase
    .from("orders")
    .update(allowed)
    .eq("id", id);

  if (error) {
    return NextResponse.json({ success: false, error: error.message });
  }

  return NextResponse.json({
    success: true,
    updated: allowed,
  });
}
