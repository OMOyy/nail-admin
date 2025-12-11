"use client"

import useSWR from "swr"
import { useMemo, useState } from "react"
import { supabase } from "@/lib/supabaseClient"
import StatCard from "@/components/StatCard"
import { SIZE_LABELS, SHAPE_LABELS } from "@/lib/constants"

import {
  LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell,
  BarChart, Bar,
} from "recharts"

/* -----------------------------------------
 * 📌 SWR Fetcher：抓全部 orders
 * ----------------------------------------- */
const fetchOrders = async () => {
  const { data, error } = await supabase
    .from("orders")
    .select("*")
    .order("created_at", { ascending: false })

  if (error) throw new Error(error.message)
  return data || []
}

export default function StatsPage() {
  // ⭐ 預設使用本月份
  const now = new Date()
  const [selectedMonth, setSelectedMonth] = useState(now.getMonth() + 1) // 1–12 月

  const { data: orders, error, isLoading, mutate } = useSWR(
    "stats-orders",
    fetchOrders,
    { refreshInterval: 10000 }
  )

  /* -----------------------------------------
   * 📌 計算該月的起始時間
   * ----------------------------------------- */
  const monthStart = new Date(now.getFullYear(), selectedMonth - 1, 1)
  const monthEnd = new Date(now.getFullYear(), selectedMonth, 1)
  const daysInMonth = new Date(now.getFullYear(), selectedMonth, 0).getDate()

  /* -----------------------------------------
   * 📌 該月訂單
   * ----------------------------------------- */
  const ordersThisMonth = useMemo(() => {
    if (!orders) return []
    return orders.filter(o => {
      const t = new Date(o.created_at)
      return t >= monthStart && t < monthEnd
    })
  }, [orders, selectedMonth])

  const revenueMonth = ordersThisMonth.reduce((sum, o) => sum + (o.price ?? 0), 0)
  const avgOrderMonth = ordersThisMonth.length
    ? Math.round(revenueMonth / ordersThisMonth.length)
    : 0

  /* -----------------------------------------
   * 📌 該月折線資料（每日訂單數）
   * ----------------------------------------- */
  const lineData = Array.from({ length: daysInMonth }).map((_, i) => {
    const d = new Date(now.getFullYear(), selectedMonth - 1, i + 1)
    const key = d.toISOString().slice(0, 10)

    const dailyOrders = ordersThisMonth.filter(
      o => o.created_at.slice(0, 10) === key
    )

    return { date: key.slice(5), count: dailyOrders.length }
  })

  /* -----------------------------------------
   * 📌 本月營收折線圖（每日 / 累積）
   * ----------------------------------------- */
  const lineRevenueData = Array.from({ length: daysInMonth }).map((_, i) => {
    const d = new Date(now.getFullYear(), selectedMonth - 1, i + 1)
    const key = d.toISOString().slice(0, 10)

    const dailyRevenue = ordersThisMonth
      .filter(o => o.created_at.slice(0, 10) === key)
      .reduce((sum, o) => sum + (o.price ?? 0), 0)

    return { date: key.slice(5), dailyRevenue }
  })

  let cumulative = 0
  const lineCumulativeRevenue = lineRevenueData.map(d => {
    cumulative += d.dailyRevenue
    return { date: d.date, revenue: cumulative }
  })

  /* -----------------------------------------
   * 📌 形狀 / 尺寸分布（該月）
   * ----------------------------------------- */
  const COLORS = ["#FFB703", "#FB8500", "#8ECAE6", "#023047", "#06D6A0"]

  const shapeData = useMemo(() => {
    const map: Record<string, number> = {}
    ordersThisMonth.forEach(o => {
      const label = SHAPE_LABELS[o.shape] ?? o.shape
      map[label] = (map[label] ?? 0) + 1
    })
    return Object.entries(map).map(([name, value]) => ({ name, value }))
  }, [ordersThisMonth])

  const sizeData = useMemo(() => {
    const map: Record<string, number> = {}
    ordersThisMonth.forEach(o => {
      const label = SIZE_LABELS[o.size] ?? o.size
      map[label] = (map[label] ?? 0) + 1
    })
    return Object.entries(map).map(([name, value]) => ({ name, value }))
  }, [ordersThisMonth])

  /* -----------------------------------------
   * 📌 Render
   * ----------------------------------------- */
  if (isLoading)
    return <div className="text-center py-10 text-brand-700">統計資料載入中...</div>

  if (error)
    return <div className="text-center py-10 text-red-600">錯誤：{error.message}</div>

  return (
    <section className="space-y-6">

      {/* 頁首 + 月份切換 */}
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold text-brand-900">銷售統計（月報）</h1>

        <div className="flex items-center gap-3">
          {/* ⭐ 月份選擇下拉 */}
          <select
            className="px-3 py-1 border rounded-xl bg-white text-brand-800"
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(Number(e.target.value))}
          >
            {Array.from({ length: 12 }).map((_, i) => (
              <option key={i} value={i + 1}>
                {i + 1} 月
              </option>
            ))}
          </select>

          <button
            onClick={() => mutate()}
            className="px-3 py-1 rounded-lg bg-brand-200 text-brand-800 hover:bg-brand-300 transition"
          >
            ↻ 重抓資料
          </button>
        </div>
      </div>

      {/* KPI 卡片 */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard title={`${selectedMonth} 月營收`} value={`${revenueMonth} 元`} />
        <StatCard title={`${selectedMonth} 月訂單數`} value={`${ordersThisMonth.length} 筆`} />
        <StatCard title="平均客單價" value={`${avgOrderMonth} 元`} />
        <StatCard title="已完成訂單/已寄出" value={`${ordersThisMonth.filter(o => o.status === "已寄出").length
          } 筆`} />
      </div>

      {/* 本月累積營收 */}
      <div className="p-4 bg-white rounded-2xl border">
        <h2 className="font-semibold mb-3">💰 本月累積營收</h2>
        <ResponsiveContainer width="100%" height={200}>
          <LineChart data={lineCumulativeRevenue}>
            <XAxis dataKey="date" />
            <YAxis />
            <Tooltip />
            <Line type="monotone" dataKey="revenue" stroke="#06D6A0" strokeWidth={2} />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* 訂單數折線圖 */}
      <div className="p-4 bg-white rounded-2xl border">
        <h2 className="font-semibold mb-3">📈 本月訂單趨勢</h2>
        <ResponsiveContainer width="100%" height={200}>
          <LineChart data={lineData}>
            <XAxis dataKey="date" />
            <YAxis />
            <Tooltip />
            <Line type="monotone" dataKey="count" stroke="#FB8500" strokeWidth={2} />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* 形狀與尺寸 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

        {/* 形狀分布 */}
        <div className="p-4 bg-white rounded-2xl border">
          <h2 className="font-semibold mb-3">🍩 形狀分布</h2>
          <ResponsiveContainer width="100%" height={240}>
            <PieChart>
              <Pie
                data={shapeData}
                dataKey="value"
                nameKey="name"
                outerRadius={90}
                label={({ percent = 0, name }) =>
                  `${name} ${(percent * 100).toFixed(0)}%`
                }
              >
                {shapeData.map((_, i) => (
                  <Cell key={i} fill={COLORS[i % COLORS.length]} />
                ))}
              </Pie>
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* 尺寸分布 */}
        <div className="p-4 bg-white rounded-2xl border">
          <h2 className="font-semibold mb-3">📏 尺寸分布</h2>
          <ResponsiveContainer width="100%" height={240}>
            <PieChart>
              <Pie
                data={sizeData}
                dataKey="value"
                nameKey="name"
                outerRadius={90}
                label={({ percent = 0, name }) =>
                  `${name} ${(percent * 100).toFixed(0)}%`
                }
              >
                {sizeData.map((_, i) => (
                  <Cell key={i} fill={COLORS[i % COLORS.length]} />
                ))}
              </Pie>
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

    </section>
  )
}
