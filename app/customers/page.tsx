"use client"

import useSWR from "swr"
import CustomerCard from "@/components/CustomerCard"
import { supabase } from "@/lib/supabaseClient"

interface OrderRow {
  id: string
  customer: string
  price: number
  status: string
  created_at: string
}

interface CustomerStat {
  name: string
  count: number
  lastOrder: string | null
  history: OrderRow[]
}

/* -----------------------------------------
 * 📌 fetcher：一次抓 orders → 自動分組成客戶資料
 * ----------------------------------------- */
const fetchCustomerStats = async (): Promise<{
  list: CustomerStat[]
  top: string | null
}> => {
  const { data, error } = await supabase
    .from("orders")
    .select("id, customer, price, status, created_at")
    .order("created_at", { ascending: false })

  if (error) throw new Error(error.message)
  if (!data) return { list: [], top: null }

  const map = new Map<string, CustomerStat>()

  data.forEach((o) => {
    if (!map.has(o.customer)) {
      map.set(o.customer, {
        name: o.customer,
        count: 1,
        lastOrder: o.created_at,
        history: [o],
      })
    } else {
      const old = map.get(o.customer)!
      old.count++
      old.history.push(o)

      if (o.created_at > (old.lastOrder ?? "")) {
        old.lastOrder = o.created_at
      }
    }
  })

  const sorted = Array.from(map.values()).sort((a, b) => b.count - a.count)

  return {
    list: sorted,
    top: sorted[0]?.name ?? null,
  }
}

export default function CustomersPage() {
  const { data, error, isLoading, mutate } = useSWR(
    "customers-stats",
    fetchCustomerStats,
    {
      refreshInterval: 8000, // 每 8 秒自動更新一次
    }
  )

  if (isLoading)
    return <div className="text-center py-10 text-brand-700">載入中...</div>

  if (error)
    return (
      <div className="text-center py-10 text-red-600">
        無法載入：{error.message}
      </div>
    )

  const list = data?.list ?? []
  const top = data?.top ?? null

  return (
    <section>
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold text-brand-900">客戶管理</h2>
        <button
          onClick={() => mutate()}
          className="px-3 py-1.5 rounded-lg bg-brand-200 text-brand-800 hover:bg-brand-300 transition text-sm"
        >
          ↻ 重新整理
        </button>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {list.map((c) => (
          <CustomerCard key={c.name} data={c} isTop={c.name === top} />
        ))}
      </div>
    </section>
  )
}
