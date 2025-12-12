export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { S3Client, DeleteObjectCommand } from "@aws-sdk/client-s3";
import { getServerSupabase } from "@/lib/serverSupabase"
// ✅ 在 route 裡「當場 new」
const r2 = new S3Client({
  region: "auto",
  endpoint: process.env.R2_ENDPOINT_URL!,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID!,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
  },
});


export async function POST(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  console.log("🔥 DELETE ORDER HIT, id =", id);
  const supabase = getServerSupabase()

  // 1️⃣ 取圖片
  const { data: order } = await supabase
    .from("orders")
    .select("style_imgs")
    .eq("id", id)
    .single();

  const imgs: string[] = order?.style_imgs || [];

  // 2️⃣ 刪 R2
  for (const url of imgs) {
    const key = url.replace(process.env.R2_PUBLIC_URL + "/", "").split("?")[0];
    if (!key) continue;

    console.log("🗑️ Deleting R2 key =", key);

    await r2.send(
      new DeleteObjectCommand({
        Bucket: process.env.R2_BUCKET_NAME!,
        Key: key,
      })
    );

    console.log("✅ R2 deleted:", key);
  }

  // 3️⃣ 刪 DB
  await supabase.from("orders").delete().eq("id", id);

  return NextResponse.json({ success: true });
}
