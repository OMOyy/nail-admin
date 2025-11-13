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

  /** ✅ 初始載入資料 */
  useEffect(() => {
    const fetchOrders = async () => {
      const { data, error } = await supabase
        .from("orders")
        .select("*")
        .order("created_at", { ascending: false })

      if (error) {
        console.error("讀取訂單失敗：", error.message)
      } else if (data) {
        setOrders(data)
      }
      setLoading(false)
    }

    fetchOrders()
  }, [])

  /** ✅ 依照狀態過濾 */
  const filtered = useMemo(() => {
    let list = [...orders]
    if (tab !== "全部") list = list.filter((o) => o.status === tab)
    return list
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
            <OrderCard key={o.id} o={o} />
          ))}
        </div>
      )}
    </section>
  )
}
