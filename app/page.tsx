"use client"

import useSWR from "swr"
import Link from "next/link"
import { supabase } from "@/lib/supabaseClient"
import StatCard from "@/components/StatCard"
import ChartSparkline, { Point } from "@/components/ChartSparkline"
import type { Order } from "@/types/order"
import { Package, DollarSign, Activity, Clock } from "lucide-react"
import { useMemo } from "react"

const twCurrency = (n: number) =>
  new Intl.NumberFormat("zh-TW", {
    style: "currency",
    currency: "TWD",
    maximumFractionDigits: 0,
  }).format(n)

/* ----------------------------------------------------------
 * 🔥 SWR fetcher：抓「本月」所有訂單
 * --------------------------------------------------------*/
const fetchMonthlyOrders = async (): Promise<Order[]> => {
  const now = new Date()
  const year = now.getFullYear()
  const month = now.getMonth()
  const firstDay = new Date(year, month, 1)

  const { data, error } = await supabase
    .from("orders")
    .select("*")
    .gte("created_at", firstDay.toISOString()) // 本月
    .order("created_at", { ascending: false })

  if (error) throw new Error(error.message)
  return data || []
}

export default function DashboardPage() {
  /* ----------------------------------------------------------
   * 🔥 SWR：自動快取 + 重新整理 + error retry
   * --------------------------------------------------------*/
  const {
    data: orders = [],
    isLoading,
    error,
  } = useSWR("orders-this-month", fetchMonthlyOrders, {
    revalidateOnFocus: true,
    dedupingInterval: 3000,
  })

  /* ----------------------------------------------------------
   *  指標計算
   * --------------------------------------------------------*/
  const { totalRevenue, totalOrders, avgOrderPrice, pendingCount } =
    useMemo(() => {
      const totalRevenue = orders.reduce((s, o) => s + (o.price || 0), 0)
      const totalOrders = orders.length
      const avgOrderPrice = totalOrders
        ? Math.round(totalRevenue / totalOrders)
        : 0

      const pendingStatuses = new Set([
        "未付定金",
        "已付定金",
        "已完成未下單",
        "已下單",
      ])
      const pendingCount = orders.filter((o) =>
        pendingStatuses.has(o.status)
      ).length

      return { totalRevenue, totalOrders, avgOrderPrice, pendingCount }
    }, [orders])

  /* ----------------------------------------------------------
   *  近 7 日營收 sparkline
   * --------------------------------------------------------*/
  const spark: Point[] = useMemo(() => {
    const days: string[] = []
    for (let i = 6; i >= 0; i--) {
      const d = new Date()
      d.setDate(d.getDate() - i)
      days.push(
        d.toLocaleDateString("zh-TW", { timeZone: "Asia/Taipei" })
      )
    }

    const map = new Map(days.map((k) => [k, 0]))

    for (const o of orders) {
      const key = new Date(o.created_at).toLocaleDateString("zh-TW", {
        timeZone: "Asia/Taipei",
      })
      if (map.has(key)) {
        map.set(key, (map.get(key) || 0) + (o.price || 0))
      }
    }

    return days.map((k, idx) => ({
      x: idx,
      y: map.get(k) || 0,
    }))
  }, [orders])

  const recent = useMemo(() => orders.slice(0, 6), [orders])

  /* ----------------------------------------------------------
   *  UI
   * --------------------------------------------------------*/
  return (
    <section className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-brand-900">儀表板</h1>
        <Link
          href="/orders/new"
          className="rounded-xl bg-brand-400 px-4 py-2 font-medium text-white shadow hover:bg-brand-500"
        >
          + 新增訂單
        </Link>
      </div>

      {/* 指標卡片 */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="本月營收"
          value={twCurrency(totalRevenue)}
          hint="從月初到今天"
          icon={<DollarSign size={18} />}
        />
        <StatCard
          title="本月訂單"
          value={totalOrders}
          suffix="筆"
          icon={<Package size={18} />}
        />
        <StatCard
          title="平均客單"
          value={twCurrency(avgOrderPrice)}
          icon={<Activity size={18} />}
        />
        <StatCard
          title="未完成 / 未出貨"
          value={pendingCount}
          suffix="筆"
          icon={<Clock size={18} />}
        />
      </div>

      {/* 趨勢圖 + 近期訂單 */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* 7 日營收 */}
        <div className="rounded-2xl border border-brand-200 bg-white p-4 shadow-soft lg:col-span-2">
          <div className="mb-3 flex items-center justify-between">
            <p className="text-sm font-semibold text-brand-800">近 7 日營收</p>
            <span className="text-xs text-brand-600">台北時區</span>
          </div>
          <ChartSparkline points={spark} />
          <div className="mt-2 text-right text-sm text-brand-700">
            本日：{twCurrency(spark.at(-1)?.y || 0)}
          </div>
        </div>

        {/* 近期訂單 */}
        <div className="rounded-2xl border border-brand-200 bg-white p-4 shadow-soft">
          <div className="mb-3 flex items-center justify-between">
            <p className="text-sm font-semibold text-brand-800">近期訂單</p>
            <Link
              href="/orders"
              className="text-sm text-brand-600 hover:text-brand-800"
            >
              查看全部 →
            </Link>
          </div>

          {isLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <div
                  key={i}
                  className="h-12 animate-pulse rounded-lg bg-brand-100"
                />
              ))}
            </div>
          ) : recent.length === 0 ? (
            <div className="grid h-32 place-items-center text-brand-600">尚無訂單</div>
          ) : (
            <ul className="space-y-3">
              {recent.map((o) => (
                <li key={o.id}>
                  <Link
                    href={`/orders/${o.id}/edit`}
                    className="flex items-center justify-between rounded-xl border border-brand-200 p-3 hover:border-brand-400 hover:shadow-soft"
                  >
                    <div className="min-w-0">
                      <p className="truncate font-medium text-brand-900">{o.customer}</p>
                      <p className="truncate text-sm text-brand-700">
                        {new Date(o.created_at).toLocaleString("zh-TW")}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-brand-800">
                        {twCurrency(o.price || 0)}
                      </p>
                      <p className="text-xs text-brand-600">{o.status}</p>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </section>
  )
}
