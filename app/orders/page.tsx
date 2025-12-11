"use client"
import { useEffect, useState, useMemo } from "react"
import Link from "next/link"
import OrderCard from "@/components/OrderCard"
import OrderFilterBar from "@/components/OrderFilterBar"
import { supabase } from "@/lib/supabaseClient"
import type { Order } from "@/types/order"
import type { TabKey } from "@/lib/constants"
import { TABS } from "@/lib/constants"

export default function OrdersPage() {

  // ⭐ 預設為第一個 Tab：「已付定金」
  const [tab, setTab] = useState<TabKey>(TABS[0])
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)

  /** ============================
   *  查詢訂單（依 tab 狀態）
   * ===========================*/
  async function fetchOrders(tabNow: TabKey) {
    let query = supabase
      .from("orders")
      .select("*")
      .eq("status", tabNow) // ★ 直接用 tabNow
      .order("created_at", { ascending: false })
      .limit(200)

    let res = await query

    // Retry 機制
    if (res.error && res.error.code === "500") {
      await new Promise((r) => setTimeout(r, 50))
      res = await query
    }

    return res
  }

  /** ============================
   *  初始載入 + tab 變動重新抓
   * ===========================*/
  useEffect(() => {
    setLoading(true)
    fetchOrders(tab)
      .then((res) => {
        if (!res.error) setOrders(res.data || [])
      })
      .finally(() => setLoading(false))
  }, [tab])

  /** ============================
   *  提供給 OrderCard 更新狀態後重新拉資料
   * ===========================*/
  const refreshOrders = () => {
    fetchOrders(tab).then((res) => {
      if (!res.error) setOrders(res.data || [])
    })
  }

  /** ============================
   *  過濾（現在不需要特判「全部」了）
   * ===========================*/
  const filtered = useMemo(() => {
    return orders.filter((o) => o.status === tab)
  }, [orders, tab])

  /** ============================
   *  載入畫面
   * ===========================*/
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

      {/* ⭐ tabs：已付定金 | 已下單 | 已寄出 */}
      <OrderFilterBar tab={tab} setTab={setTab} />

      {/* 列表 */}
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
