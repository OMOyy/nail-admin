// scripts/migrateImages.js
import { createClient } from "@supabase/supabase-js";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";

// ----------------------------
// 🔧 1. Supabase client
// ----------------------------
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL ?? "",
  process.env.NEXT_PUBLIC_SUPABASE_KEY ?? ""
);


// ----------------------------
// 🔧 2. Cloudflare R2 client
// ----------------------------
const r2 = new S3Client({
  region: "auto",
  endpoint: process.env.R2_ENDPOINT_URL,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID ?? "",
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY ?? "",
  },
});


// ----------------------------
// 🔧 Retry helper
// ----------------------------
async function retry(fn:any, retries = 3) {
  let lastErr;
  for (let i = 0; i < retries; i++) {
    try {
      return await fn();
    } catch (err) {
      lastErr = err;
      await new Promise((r) => setTimeout(r, 500));
    }
  }
  throw lastErr;
}

// ----------------------------
// 🚀 主流程
// ----------------------------
async function migrate() {
  console.log("=== 📦 開始搬移 Supabase → R2 ===");

  const { data, error } = await supabase
    .from("orders")
    .select("id, style_imgs");

  if (error) {
    console.error("❌ 無法讀取 Supabase 訂單：", error);
    return;
  }

  console.log(`📌 共 ${data.length} 筆訂單待處理\n`);

  for (const row of data) {
    const id = row.id;
    const imgs = row.style_imgs || [];

    console.log(`\n=== 🔧 訂單 ${id}：${imgs.length} 張圖片 ===`);

    const newUrls = [];

    for (const url of imgs) {
      if (!url) continue;

      // ⭐ 若已經是 R2 → 跳過
      if (url.includes(process.env.R2_PUBLIC_URL)) {
        console.log("⏭ 已是 R2 圖片 → 跳過");
        newUrls.push(url);
        continue;
      }

      try {
        console.log("⬇ 下載：", url);
        const res = await retry(() => fetch(url));
        const buffer = Buffer.from(await res.arrayBuffer());

        const fileName = `migrate-${Date.now()}-${Math.random()
          .toString(36)
          .slice(2)}.jpg`;

        console.log("⬆ 上傳至 R2：", fileName);

        await retry(() =>
          r2.send(
            new PutObjectCommand({
              Bucket: process.env.R2_BUCKET_NAME,
              Key: fileName,
              Body: buffer,
              ContentType: "image/jpeg",
            })
          )
        );

        const publicUrl = `${process.env.R2_PUBLIC_URL}/${fileName}`;
        newUrls.push(publicUrl);

        console.log("✔ 搬移成功 →", publicUrl);
      } catch (err) {
        console.error("❌ 搬移失敗：", url, err);
      }
    }

    // ⭐ 更新到 Supabase
    await supabase.from("orders").update({ style_imgs: newUrls }).eq("id", id);

    console.log(`🎉 訂單 ${id} 搬移完畢`);
  }

  console.log("\n=== 🎉 全部搬移完成！ ===");
}

// ----------------------------
// 🚀 啟動
// ----------------------------
migrate();
