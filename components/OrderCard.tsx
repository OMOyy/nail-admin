"use client"
import Link from "next/link"
import type { Order } from "@/types/order"

const twCurrency = (n: number) =>
  new Intl.NumberFormat("zh-TW", {
    style: "currency",
    currency: "TWD",
    maximumFractionDigits: 0,
  }).format(n)

export default function OrderCard({ o }: { o: Order }) {
  return (
    <Link
      href={`/orders/${o.id}/edit`}
      className="block bg-white border border-brand-200 rounded-2xl overflow-hidden hover:shadow-soft hover:border-brand-400 transition"
    >
    <img
        src={o.style_imgs?.[0] || "/placeholder.png"}
        alt="款式"
        className="w-full h-40 object-cover"
      />
      <div className="p-4 space-y-2">
        <div className="flex justify-between items-center">
          <h3 className="font-bold text-lg text-brand-900">{o.customer}</h3>
          <span className="text-sm text-brand-600">
            {new Date(o.created_at).toLocaleDateString("zh-TW")}
          </span>
        </div>

        <p className="text-brand-800/90 text-sm">{o.note || "—"}</p>

        <div className="text-sm text-brand-700">
          數量：<span className="font-semibold text-brand-900">{o.quantity}</span>
        </div>

        <div className="flex justify-between items-center pt-2">
          <span
            className={[
              "px-2.5 py-1 rounded-full text-xs border font-medium",
              o.status === "已完成未下單" && "bg-green-100 text-green-800 border-green-300",
              o.status === "已寄出" && "bg-blue-100 text-blue-800 border-blue-300",
              o.status === "已付定金" && "bg-yellow-100 text-yellow-800 border-yellow-300",
              o.status === "未付定金" && "bg-gray-100 text-gray-700 border-gray-300",
              o.status === "已下單" && "bg-orange-100 text-orange-800 border-orange-300",
            ]
              .filter(Boolean)
              .join(" ")}
          >
            {o.status}
          </span>
          <span className="text-brand-700 font-bold">{twCurrency(o.price)}</span>
        </div>
      </div>
    </Link>
  )
}
