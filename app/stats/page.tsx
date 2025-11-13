"use client"
import { useEffect, useState, useMemo } from "react"
import { supabase } from "@/lib/supabaseClient"
import StatCard from "@/components/StatCard"
import { SIZE_LABELS, SHAPE_LABELS } from "@/lib/constants"

import {
  LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell,
  BarChart, Bar,
} from "recharts"

export default function StatsPage() {
  const [orders, setOrders] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      const { data } = await supabase.from("orders").select("*")
      setOrders(data || [])
      setLoading(false)
    }
    load()
  }, [])

  const now = new Date()
  const since30 = new Date(now.getTime() - 30 * 86400000)


  // ========== 30 天資料 ==========
  const orders30 = useMemo(
    () => orders.filter((o) => new Date(o.created_at) >= since30),
    [orders]
  )

  const revenue30 = orders30.reduce((sum, o) => sum + (o.price ?? 0), 0)
  const avgOrder30 = orders30.length ? Math.round(revenue30 / orders30.length) : 0

  // ========== 折線圖資料 ==========
  const lineData = Array.from({ length: 30 }).map((_, i) => {
    const d = new Date(now.getTime() - (29 - i) * 86400000)
    const key = d.toISOString().slice(0, 10)

    const dailyOrders = orders30.filter(
      (o) => o.created_at.slice(0, 10) === key
    )

    return {
      date: key.slice(5),
      count: dailyOrders.length,
    }
  })
  // ========== 30 天累積營收折線圖 ==========
  const lineRevenueData = Array.from({ length: 30 }).map((_, i) => {
    const d = new Date(now.getTime() - (29 - i) * 86400000)
    const key = d.toISOString().slice(0, 10)

    const dailyRevenue = orders30
      .filter((o) => o.created_at.slice(0, 10) === key)
      .reduce((sum, o) => sum + (o.price ?? 0), 0)

    return {
      date: key.slice(5),
      dailyRevenue,
    }
  })

  // 累積
  let cumulative = 0
  const lineCumulativeRevenue = lineRevenueData.map((d) => {
    cumulative += d.dailyRevenue
    return {
      date: d.date,
      revenue: cumulative,
    }
  })


  // ========== 形狀與尺寸分布 ==========
  const shapeCount: Record<string, number> = {}
  const sizeCount: Record<string, number> = {}

  orders.forEach((o) => {
    shapeCount[o.shape] = (shapeCount[o.shape] ?? 0) + 1
    sizeCount[o.size] = (sizeCount[o.size] ?? 0) + 1
  })

  const shapeData = Object.entries(
    orders.reduce((acc: Record<string, number>, o) => {
      const label = SHAPE_LABELS[o.shape] ?? o.shape
      acc[label] = (acc[label] || 0) + 1
      return acc
    }, {})
  ).map(([name, value]) => ({ name, value }))

  const sizeData = Object.entries(
    orders.reduce((acc: Record<string, number>, o) => {
      const label = SIZE_LABELS[o.size] ?? o.size
      acc[label] = (acc[label] || 0) + 1
      return acc
    }, {})
  ).map(([name, value]) => ({ name, value }))

  const COLORS = ["#FFB703", "#FB8500", "#8ECAE6", "#023047"]

  // ========== 完成時間 ==========
  const completeDataMap: Record<string, number> = {}

  orders
    .filter((o) => o.completed_at)
    .forEach((o) => {
      const key = o.completed_at.slice(0, 10)
      completeDataMap[key] = (completeDataMap[key] ?? 0) + 1
    })

  const completeData = Object.entries(completeDataMap).map(([date, count]) => ({
    date: date.slice(5),
    count,
  }))

  return (
    <section className="space-y-6">
      <h1 className="text-2xl font-bold text-brand-900">銷售統計</h1>

      {/* 指標卡片 */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard title="近 30 天營收" value={`${revenue30} 元`} />
        <StatCard title="近 30 天訂單數" value={`${orders30.length} 筆`} />
        <StatCard title="平均客單價" value={`${avgOrder30} 元`} />
        <StatCard title="已完成訂單" value={`${completeData.length} 筆`} />
      </div>

      {/* 折線圖：30 天累積營收 */}
      <div className="p-4 bg-white rounded-2xl border">
        <h2 className="font-semibold mb-3">💰 近 30 天累積營收</h2>
        <ResponsiveContainer width="100%" height={200}>
          <LineChart data={lineCumulativeRevenue}>
            <XAxis dataKey="date" />
            <YAxis />
            <Tooltip />
            <Line
              type="monotone"
              dataKey="revenue"
              stroke="#06D6A0"
              strokeWidth={2}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>


      {/* 折線圖 */}
      <div className="p-4 bg-white rounded-2xl border">
        <h2 className="font-semibold mb-3">📈 近 30 天訂單趨勢</h2>
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

        {/* 形狀 */}
        <div className="p-4 bg-white rounded-2xl border">
          <h2 className="font-semibold mb-3">🍩 形狀分布</h2>
          <ResponsiveContainer width="100%" height={240}>
            <PieChart>
              <Pie
                data={shapeData}
                dataKey="value"
                nameKey="name"
                outerRadius={90}
                label={({ percent, name }) => {
                  const p = percent ?? 0
                  return `${name} ${(p * 100).toFixed(0)}%`
                }}

              >
                {shapeData.map((_, i) => (
                  <Cell key={i} fill={COLORS[i % COLORS.length]} />
                ))}
              </Pie>
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* 尺寸 */}
        <div className="p-4 bg-white rounded-2xl border">
          <h2 className="font-semibold mb-3">📏 尺寸分布</h2>
          <ResponsiveContainer width="100%" height={240}>
            <PieChart>
              <Pie
                data={sizeData}
                dataKey="value"
                nameKey="name"
                outerRadius={90}
                label={({ percent, name }) => {
                  const p = percent ?? 0
                  return `${name} ${(p * 100).toFixed(0)}%`
                }}

              >
                {sizeData.map((_, i) => (
                  <Cell key={i} fill={COLORS[i % COLORS.length]} />
                ))}
              </Pie>
            </PieChart>
          </ResponsiveContainer>
        </div>

      </div>


      {/* 完成時間 */}
      <div className="p-4 bg-white rounded-2xl border">
        <h2 className="font-semibold mb-3">🕒 完成時間統計</h2>
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={completeData}>
            <XAxis dataKey="date" />
            <YAxis />
            <Tooltip />
            <Bar dataKey="count" fill="#8ECAE6" />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </section>
  )
}
