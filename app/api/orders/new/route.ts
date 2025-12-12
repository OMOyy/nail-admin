// app/api/orders/new/route.ts
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { getServerSupabase } from "@/lib/serverSupabase"
const r2 = new S3Client({
  region: "auto",
  endpoint: process.env.R2_ENDPOINT_URL!,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID!,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
  },
});

// ✅ 產生台灣時間戳（YYYYMMDD-HHMMSS）
function taipeiStamp() {
  const s = new Date().toLocaleString("sv-SE", { timeZone: "Asia/Taipei" }); // 2025-12-12 10:30:45
  return s.replace(/[-: ]/g, "").slice(0, 14); // 20251212103045
}
export async function POST(req: Request) {

  const form = await req.formData();

  // JSON 字段
  const json = JSON.parse(form.get("data") as string);

  // 多張圖片（真正是 File，不是 string）
  const files = form.getAll("images") as File[];

  const urls: string[] = [];

  for (const file of files) {
    const arrayBuffer = await file.arrayBuffer();

    const ext = file.name.split(".").pop() ?? "jpg";
    const filename = `order-${taipeiStamp()}-${crypto.randomUUID()}.${ext}`;

    await r2.send(
      new PutObjectCommand({
        Bucket: process.env.R2_BUCKET_NAME!,
        Key: filename,
        Body: Buffer.from(arrayBuffer),
        ContentType: file.type,
      })
    );

    urls.push(`${process.env.R2_PUBLIC_URL}/${filename}`);
  }

  const supabase = getServerSupabase()
  const { error } = await supabase
    .from("orders")
    .insert([{ ...json, style_imgs: urls }]);

  if (error) return NextResponse.json({ success: false, error: error.message });

  return NextResponse.json({ success: true });
}
