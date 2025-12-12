export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { S3Client, DeleteObjectCommand } from "@aws-sdk/client-s3";
import { getServerSupabase } from "@/lib/serverSupabase";

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  console.log("🔥 DELETE ORDER HIT, id =", id);

  const supabase = getServerSupabase();

  // R2 client（route 內 new）
  const r2 = new S3Client({
    region: "auto",
    endpoint: process.env.R2_ENDPOINT_URL!,
    credentials: {
      accessKeyId: process.env.R2_ACCESS_KEY_ID!,
      secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
    },
  });

  // 1️⃣ 取訂單圖片
  const { data: order, error: fetchErr } = await supabase
    .from("orders")
    .select("style_imgs")
    .eq("id", id)
    .single();

  if (fetchErr || !order) {
    return NextResponse.json(
      { success: false, error: "Order not found" },
      { status: 404 }
    );
  }

  const imgs: string[] = order.style_imgs || [];

  // 2️⃣ 刪 R2（並行）
  try {
    await Promise.all(
      imgs.map((url) => {
        const key = url
          .replace(process.env.R2_PUBLIC_URL + "/", "")
          .split("?")[0];

        if (!key) return Promise.resolve();

        console.log("🗑️ Deleting R2 key =", key);

        return r2.send(
          new DeleteObjectCommand({
            Bucket: process.env.R2_BUCKET_NAME!,
            Key: key,
          })
        );
      })
    );
  } catch (err) {
    console.error("❌ R2 delete failed:", err);
    // 不中斷流程
  }

  // 3️⃣ 刪 DB
  const { error: delErr } = await supabase
    .from("orders")
    .delete()
    .eq("id", id);

  if (delErr) {
    console.error("❌ DB delete failed:", delErr);
    return NextResponse.json(
      { success: false, error: delErr.message },
      { status: 500 }
    );
  }

  return NextResponse.json({ success: true });
}
