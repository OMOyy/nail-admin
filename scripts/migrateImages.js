require("dotenv").config();
const { createClient } = require("@supabase/supabase-js");
const {
  S3Client,
  PutObjectCommand,
} = require("@aws-sdk/client-s3");

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_KEY
);

const r2 = new S3Client({
  region: "auto",
  endpoint: process.env.R2_ENDPOINT_URL,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
  },
});

async function migrate() {
  console.log("🔍 讀取訂單資料中...");

  const { data: orders, error } = await supabase
    .from("orders")
    .select("id, style_imgs");

  if (error) {
    console.error("❌ Supabase 錯誤:", error.message);
    return;
  }

  console.log(`📌 共 ${orders.length} 筆訂單`);

  for (const order of orders) {
    if (!order.style_imgs || order.style_imgs.length === 0) {
      console.log(`➡️ 訂單 ${order.id} 沒有圖片，跳過`);
      continue;
    }

    // 判斷是不是 base64
    const isBase64 = order.style_imgs[0]?.startsWith("data:image");
    if (!isBase64) {
      console.log(`➡️ 訂單 ${order.id} 不是 base64，跳過`);
      continue;
    }

    console.log(`🖼️ 處理訂單 ${order.id}`);

    const newUrls = [];

    for (const b64 of order.style_imgs) {
      try {
        const base64Data = b64.split(",")[1];
        const buffer = Buffer.from(base64Data, "base64");

        const fileName = `migrated-${order.id}-${Date.now()}-${Math.random()}.jpg`;

        await r2.send(
          new PutObjectCommand({
            Bucket: process.env.R2_BUCKET_NAME,
            Key: fileName,
            Body: buffer,
            ContentType: "image/jpeg",
          })
        );

        const url = `${process.env.R2_PUBLIC_URL}/${fileName}`;
        newUrls.push(url);

        console.log(`   ➕ 已上傳：${url}`);
      } catch (err) {
        console.error("❌ 上傳錯誤:", err);
      }
    }

    // 更新資料庫
    const { error: updateErr } = await supabase
      .from("orders")
      .update({ style_imgs: newUrls })
      .eq("id", order.id);

    if (updateErr) {
      console.error("❌ 更新資料庫錯誤:", updateErr.message);
    } else {
      console.log(`✅ 訂單 ${order.id} 搬移完成`);
    }
  }

  console.log("🎉 所有舊圖片搬移完成！");
}

migrate();
