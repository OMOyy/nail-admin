import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabaseClient";
import { r2 } from "@/lib/r2Client";
import { DeleteObjectCommand } from "@aws-sdk/client-s3";

export async function POST(req: Request, context: { params: Promise<{ id: string }> }) {
  // ⬇⬇⬇ 這一行是整個問題的核心
  const { id } = await context.params; // ⭐ 必須 await，不然永遠 undefined

  console.log("DELETE ORDER ID =", id);

  // 1️⃣ 取得圖片 URL
  const { data: order, error: fetchErr } = await supabase
    .from("orders")
    .select("style_imgs")
    .eq("id", id)
    .single();

  if (fetchErr || !order) {
    console.error("Fetch error:", fetchErr);
    return NextResponse.json({
      success: false,
      error: "找不到訂單，可能已被刪除",
    });
  }

  const imgs: string[] = order.style_imgs || [];

  // 2️⃣ 刪除 R2 圖片
  for (const url of imgs) {
    const key = url.split("/").pop();
    if (!key) continue;

    try {
      await r2.send(
        new DeleteObjectCommand({
          Bucket: process.env.R2_BUCKET_NAME!,
          Key: key,
        })
      );
      console.log("Deleted R2:", key);
    } catch (err) {
      console.error("R2 deletion error:", err);
    }
  }

  // 3️⃣ 刪除 Supabase 訂單
  const { error: delErr } = await supabase.from("orders").delete().eq("id", id);

  if (delErr) {
    console.error("Supabase delete error:", delErr);
    return NextResponse.json({
      success: false,
      error: "Supabase 刪除失敗：" + delErr.message,
    });
  }

  return NextResponse.json({ success: true });
}
