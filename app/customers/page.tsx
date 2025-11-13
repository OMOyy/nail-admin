"use client"
import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabaseClient"
import CustomerCard from "@/components/CustomerCard"

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

export default function CustomersPage() {
  const [list, setList] = useState<CustomerStat[]>([])
  const [loading, setLoading] = useState(true)
  const [top, setTop] = useState<string | null>(null)

  useEffect(() => {
    const fetchOrders = async () => {
      const { data, error } = await supabase
        .from("orders")
        .select("id, customer, price, status, created_at")
        .order("created_at", { ascending: false })

      if (error) {
        console.error(error)
        setLoading(false)
        return
      }

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

      setList(sorted)
      setTop(sorted[0]?.name ?? null)
      setLoading(false)
    }

    fetchOrders()
  }, [])

  if (loading)
    return <div className="text-center py-10 text-brand-700">載入中...</div>

  return (
    <section>
      <h2 className="text-xl font-bold text-brand-900 mb-4">客戶管理</h2>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {list.map((c) => (
          <CustomerCard key={c.name} data={c} isTop={c.name === top} />
        ))}
      </div>
    </section>
  )
}
