"use client"

import useSWR from "swr"
import Link from "next/link"
import OrderCard from "@/components/OrderCard"
import OrderFilterBar from "@/components/OrderFilterBar"
import type { Order } from "@/types/order"
import type { TabKey } from "@/lib/constants"
import { useState, useMemo } from "react"
import { supabase } from "@/lib/supabaseClient"

// ---------------------
// 🔥 SWR fetcher（支援 tab）
// ---------------------
const fetchOrders = async (tab: TabKey): Promise<Order[]> => {
  let q = supabase.from("orders").select("*")

  if (tab !== "全部") {
    q = q.eq("status", tab)
  }

  q = q.order("created_at", { ascending: false }).limit(200)

  const { data, error } = await q
  if (error) throw new Error(error.message)
  return data || []
}

export default function OrdersClient() {
  const [tab, setTab] = useState<TabKey>("全部")

  // ⭐ SWR：依 tab 建立不同快取
  const { data, isLoading, mutate, error } = useSWR(
    ["orders", tab],          // ← 每個 tab 有獨立快取
    () => fetchOrders(tab),
    {
      revalidateOnFocus: true,     // 回到頁面自動 refresh
      dedupingInterval: 3000,      // 避免過度抓資料
    }
  )

  // ⭐ 更新狀態後重新抓（但只抓這個 tab）
  const refreshOrders = () => mutate()

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

      {/* ⭐ Tab 過濾 UI */}
      <OrderFilterBar tab={tab} setTab={setTab} />

      {/* ⭐ 錯誤顯示 */}
      {error && <p className="text-center text-red-500 mt-2">讀取失敗：{error.message}</p>}

      {/* ⭐ 載入中 */}
      {isLoading && (
        <div className="flex justify-center items-center h-[50vh] text-brand-700">
          載入中...
        </div>
      )}

      {/* ⭐ 列表 */}
      {!isLoading && data && (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mt-4">
          {data.map(o => (
            <OrderCard key={o.id} o={o} onStatusUpdated={refreshOrders} />
          ))}
        </div>
      )}
    </section>
  )
}
