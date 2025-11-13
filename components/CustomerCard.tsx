"use client"
import { useState } from "react"

interface OrderRecord {
  id: string
  price: number
  status: string
  created_at: string
}

interface Props {
  data: {
    name: string
    count: number
    lastOrder: string | null
    history: OrderRecord[]
  }
  isTop?: boolean
}

export default function CustomerCard({ data, isTop }: Props) {
  const [open, setOpen] = useState(false)

  return (
    <div className="bg-white rounded-2xl border border-brand-200 shadow-sm">
      <button
        onClick={() => setOpen(!open)}
        className="w-full p-4 text-left flex items-center justify-between"
      >
        <div>
          <div className="text-lg font-bold text-brand-900 flex items-center gap-1">
            {data.name}
            {isTop && <span className="text-yellow-500 text-xl mb-2">👑</span>}
          </div>

          <div className="mt-1 text-sm text-brand-700">
            下訂次數：<span className="font-semibold">{data.count}</span>
          </div>

          <div className="text-xs text-brand-500">
            最近下單：
            {data.lastOrder
              ? new Date(data.lastOrder).toLocaleDateString("zh-TW")
              : "無記錄"}
          </div>
        </div>

        <span className="text-brand-500 text-xl">{open ? "▲" : "▼"}</span>
      </button>

      <div
        className={`overflow-hidden transition-all duration-300 ${
          open ? "max-h-96" : "max-h-0"
        }`}
      >
        <div className="px-4 pb-4 space-y-3">
          {data.history.map((o) => (
            <div
              key={o.id}
              className="p-3 bg-brand-50 rounded-xl border border-brand-100 text-sm flex justify-between"
            >
              <div>
                <div className="font-medium text-brand-800">
                  {new Date(o.created_at).toLocaleDateString("zh-TW")}
                </div>
                <div className="text-xs text-brand-600">{o.status}</div>
              </div>

              <div className="font-bold text-brand-900">NT$ {o.price}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
