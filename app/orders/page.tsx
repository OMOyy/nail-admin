"use client"
import { useEffect, useState, useMemo } from "react"
import Link from "next/link"
import OrderCard from "@/components/OrderCard"
import OrderFilterBar from "@/components/OrderFilterBar"
import { supabase } from "@/lib/supabaseClient"
import type { Order, OrderStatus } from "@/types/order"

export default function OrdersPage() {
  const [tab, setTab] = useState<"全部" | OrderStatus>("全部")
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)

  /** ============================
   *  查詢訂單（加入 tab 條件）
   * ===========================*/
  async function fetchOrders(tabNow: "全部" | OrderStatus) {
    let query = supabase.from("orders").select("*")

    // ★★★ 這裡修改：全部 → 只抓已付定金前 10 筆
    if (tabNow === "全部") {
      query = query.eq("status", "已付定金").limit(10)
    } else {
      query = query.eq("status", tabNow)
    }

    query = query.order("created_at", { ascending: false })

    let res = await query

    // retry
    if (res.error && res.error.code === "500") {
      await new Promise(r => setTimeout(r, 50))
      res = await query
    }

    return res
  }


  /** 初始載入 */
  useEffect(() => {
    setLoading(true)
    fetchOrders(tab).then((res) => {
      if (!res.error) setOrders(res.data || [])
    }).finally(() => setLoading(false))
  }, [tab])


  /** 給 OrderCard 呼叫 */
  const refreshOrders = () => {
    fetchOrders(tab).then((res) => {
      if (!res.error) setOrders(res.data || [])
    })
  }


  /** 依照狀態過濾 */
  const filtered = useMemo(() => {
    if (tab === "全部") return orders
    return orders.filter((o) => o.status === tab)
  }, [orders, tab])

  if (loading)
    return (
      <div className="flex justify-center items-center h-[50vh] text-brand-700">
        載入中...
      </div>
    )

  return (
    <section>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-bold text-brand-900">訂單管理</h2>
        <Link
          href="/orders/new"
          className="bg-brand-400 text-white px-4 py-2 rounded-xl shadow hover:bg-brand-500 transition"
        >
          + 新增訂單
        </Link>
      </div>

      <OrderFilterBar tab={tab} setTab={setTab} />

      {filtered.length === 0 ? (
        <p className="text-center text-brand-600 mt-8">目前沒有訂單</p>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mt-4">
          {filtered.map((o) => (
            <OrderCard key={o.id} o={o} onStatusUpdated={refreshOrders} />
          ))}
        </div>
      )}
    </section>
  )
}
