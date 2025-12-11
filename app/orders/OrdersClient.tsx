"use client"

import useSWR from "swr"
import Link from "next/link"
import OrderCard from "@/components/OrderCard"
import OrderFilterBar from "@/components/OrderFilterBar"
import type { Order } from "@/types/order"
import type { TabKey } from "@/lib/constants"
import { useState } from "react"
import { supabase } from "@/lib/supabaseClient"

// ---------------------
// 🔥 SWR fetcher（已移除 "全部" 相關處理）
// ---------------------
const fetchOrders = async (tab: TabKey): Promise<Order[]> => {
  const { data, error } = await supabase
    .from("orders")
    .select("*")
    .eq("status", tab)                         // ← 直接依狀態查詢
    .order("created_at", { ascending: false })
    .limit(200)

  if (error) throw new Error(error.message)
  return data || []
}

export default function OrdersClient() {

  // ⭐ 預設 = 已付定金
  const [tab, setTab] = useState<TabKey>("已付定金")

  // ⭐ SWR：依 tab 抓資料
  const { data, isLoading, mutate, error } = useSWR(
    ["orders", tab],
    () => fetchOrders(tab),
    {
      revalidateOnFocus: true,
      dedupingInterval: 3000,
    }
  )

  // ⭐ 狀態更新後 refresh
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

      {/* ⭐ 移除全部，只顯示你設定的 STATUSES Tabs */}
      <OrderFilterBar tab={tab} setTab={setTab} />

      {/* 錯誤 */}
      {error && (
        <p className="text-center text-red-500 mt-2">
          讀取失敗：{error.message}
        </p>
      )}

      {/* 載入中 */}
      {isLoading && (
        <div className="flex justify-center items-center h-[50vh] text-brand-700">
          載入中...
        </div>
      )}

      {/* 訂單列表 */}
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
