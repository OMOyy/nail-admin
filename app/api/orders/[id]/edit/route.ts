// /app/api/orders/[id]/edit/route.ts
export const runtime = "nodejs"
export const dynamic = "force-dynamic"

import { NextResponse } from "next/server"
import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
} from "@aws-sdk/client-s3"
import { getServerSupabase } from "@/lib/serverSupabase"

// ---------------- R2 ----------------
const r2 = new S3Client({
  region: "auto",
  endpoint: process.env.R2_ENDPOINT_URL!,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID!,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
  },
})

// 🇹🇼 台灣時間
const nowTW = () => Date.now() + 8 * 60 * 60 * 1000

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  console.log("🔥 HIT /api/orders/[id]/edit", id)

  try {
    const form = await req.formData()
    const json = JSON.parse(form.get("data") as string)

    const oldImages = form.getAll("oldImages") as string[]
    const newFiles = form.getAll("newImages") as File[]

    const supabase = getServerSupabase()

    // ① 取原本圖片
    const { data: exist, error } = await supabase
      .from("orders")
      .select("style_imgs")
      .eq("id", id)
      .single()

    if (error) throw error

    const existingUrls: string[] = exist?.style_imgs || []

    // ② 刪除被移除的圖片（並行）
    const toDelete = existingUrls.filter(
      (url) => !oldImages.includes(url)
    )

    await Promise.all(
      toDelete.map((url) => {
        const key = url.replace(process.env.R2_PUBLIC_URL + "/", "")
        if (!key) return Promise.resolve()

        return r2.send(
          new DeleteObjectCommand({
            Bucket: process.env.R2_BUCKET_NAME!,
            Key: key,
          })
        )
      })
    )

    // ③ 上傳新圖片（並行）
    const newUrls = await Promise.all(
      newFiles.map(async (file) => {
        const buffer = Buffer.from(await file.arrayBuffer())
        const ext = file.name.split(".").pop() ?? "jpg"
        const filename = `order-${id}-${nowTW()}-${Math.random()
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

    // ④ 更新資料
    const { error: updateErr } = await supabase
      .from("orders")
      .update({
        customer: json.customer ?? null,
        size: json.size ?? null,
        shape: json.shape ?? null,
        custom_size_note: json.custom_size_note ?? null,
        quantity: json.quantity ?? null,
        price: json.price ?? null,
        note: json.note ?? null,
        status: json.status ?? null,
        style_imgs: [...oldImages, ...newUrls],
      })
      .eq("id", id)

    if (updateErr) throw updateErr

    return NextResponse.json({ success: true })
  } catch (err: any) {
    console.error("🔥 EDIT API CRASH:", err)
    return NextResponse.json(
      { success: false, error: err.message ?? "Server error" },
      { status: 500 }
    )
  }
}
