// app/api/orders/new/route.ts
export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { getServerSupabase } from "@/lib/serverSupabase";

// ---------------- R2 Client ----------------
const r2 = new S3Client({
  region: "auto",
  endpoint: process.env.R2_ENDPOINT_URL!,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID!,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
  },
});

// 🇹🇼 取得台灣時間（毫秒）
function taiwanNowMs() {
  return Date.now() + 8 * 60 * 60 * 1000;
}

export async function POST(req: Request) {
  try {
    console.log("🔥 HIT /api/orders/new");

    const form = await req.formData();
    const json = JSON.parse(form.get("data") as string);
    const files = form.getAll("images") as File[];

    // ---------------- ① 並行上傳圖片 ----------------
    const urls = await Promise.all(
      files.map(async (file) => {
        const buffer = Buffer.from(await file.arrayBuffer());
        const ext = file.name.split(".").pop() ?? "jpg";

        const filename = `order-${taiwanNowMs()}-${Math.random()
          .toString(36)
          .slice(2)}.${ext}`;

        await r2.send(
          new PutObjectCommand({
            Bucket: process.env.R2_BUCKET_NAME!,
            Key: filename,
            Body: buffer,
            ContentType: file.type,
          })
        );

        return `${process.env.R2_PUBLIC_URL}/${filename}`;
      })
    );

    // ---------------- ② 寫入 Supabase ----------------
    const supabase = getServerSupabase();

    const { error } = await supabase
      .from("orders")
      .insert([{ ...json, style_imgs: urls }]);

    if (error) {
      console.error("Supabase insert error:", error);
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error("🔥 API CRASH:", err);
    return NextResponse.json(
      { success: false, error: err.message ?? "Unknown server error" },
      { status: 500 }
    );
  }
}
