import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_KEY!
)

const STATUS_FLOW = [ "已付定金", "已下單", "已寄出"]

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params   // ← ★★★ 必須 await

  // 取得目前狀態
  const { data: order, error: fetchError } = await supabase
    .from("orders")
    .select("status")
    .eq("id", id)
    .single()

  if (fetchError || !order) {
    return NextResponse.json({ error: "訂單不存在" }, { status: 404 })
  }

  const currentIndex = STATUS_FLOW.indexOf(order.status)
  if (currentIndex === -1) {
    return NextResponse.json({ error: "未知狀態" }, { status: 400 })
  }

  if (currentIndex === STATUS_FLOW.length - 1) {
    return NextResponse.json({ status: order.status })
  }

  const newStatus = STATUS_FLOW[currentIndex + 1]

  const { error: updateError } = await supabase
    .from("orders")
    .update({ status: newStatus })
    .eq("id", id)

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 500 })
  }

  return NextResponse.json({ status: newStatus })
}
