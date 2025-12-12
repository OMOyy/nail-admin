// app/api/orders/new/route.ts
export const runtime = "nodejs"
export const dynamic = "force-dynamic"

import { NextResponse } from "next/server"
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3"
import { getServerSupabase } from "@/lib/serverSupabase"

// ---------------- R2 Client ----------------
const r2 = new S3Client({
  region: "auto",
  endpoint: process.env.R2_ENDPOINT_URL!,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID!,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
  },
})

// 🇹🇼 台灣時間（毫秒）
const nowTW = () => Date.now() + 8 * 60 * 60 * 1000

export async function POST(req: Request) {
  console.log("🔥 HIT /api/orders/new")

  try {
    const form = await req.formData()

    // ① 前端 JSON
    const jsonRaw = form.get("data")
    if (!jsonRaw) {
      return NextResponse.json(
        { success: false, error: "Missing order data" },
        { status: 400 }
      )
    }
    const json = JSON.parse(jsonRaw as string)

    // ② 圖片（File）
    const files = form.getAll("images") as File[]

    // ③ 並行上傳圖片到 R2
    const urls = await Promise.all(
      files.map(async (file) => {
        const buffer = Buffer.from(await file.arrayBuffer())
        const ext = file.name.split(".").pop() ?? "jpg"

        const filename = `order-${nowTW()}-${Math.random()
          .toString(36)
          .slice(2)}.${ext}`

        await r2.send(
          new PutObjectCommand({
            Bucket: process.env.R2_BUCKET_NAME!,
            Key: filename,
            Body: buffer,
            ContentType: file.type,
          })
        )

        return `${process.env.R2_PUBLIC_URL}/${filename}`
      })
    )

    // ④ 白名單欄位（防止亂塞）
    const allowed = {
      customer: json.customer ?? null,
      size: json.size ?? null,
      shape: json.shape ?? null,
      custom_size_note: json.custom_size_note ?? null,
      quantity: json.quantity ?? null,
      price: json.price ?? null,
      note: json.note ?? null,
      status: json.status ?? null,
      style_imgs: urls,
    }

    // ⑤ 寫入 Supabase
    const supabase = getServerSupabase()

    const { error } = await supabase.from("orders").insert([allowed])

    if (error) {
      console.error("Supabase insert error:", error)
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true })
  } catch (err: any) {
    console.error("🔥 NEW ORDER API CRASH:", err)
    return NextResponse.json(
      { success: false, error: err.message ?? "Server error" },
      { status: 500 }
    )
  }
}
