"use client"
import { useState } from "react"
import Link from "next/link"
import type { Order } from "@/types/order"
import { ChevronDown, ChevronUp, Pencil } from "lucide-react"
import { STATUSES } from "@/lib/constants"

type Props = {
  o: Order
  onStatusUpdated?: () => void   // ⭐ 父層傳入更新函式
}

const STATUS_FLOW = ["已付定金", "已下單", "已寄出"]
type OrderStatus = (typeof STATUS_FLOW)[number]

const twCurrency = (n: number) =>
  new Intl.NumberFormat("zh-TW", {
    style: "currency",
    currency: "TWD",
    maximumFractionDigits: 0,
  }).format(n)

export default function OrderCard({ o, onStatusUpdated }: Props) {
  const [open, setOpen] = useState(false)
  const [activeImage, setActiveImage] = useState<string | null>(null)
  const [currentIndex, setCurrentIndex] = useState(0)

  // ⭐ 用 local state 讓畫面能更新
  const [status, setStatus] = useState<OrderStatus>(o.status as OrderStatus)

  /** ⭐ 狀態往後推 */
  const handleNextStatus = async () => {
    try {
      const res = await fetch(`/api/orders/${o.id}/next-status`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      })
      console.log("OrderCard 收到訂單：", o)
      console.log("訂單 ID =", o.id)

      const json = await res.json()

      if (!res.ok) {
        alert("更新失敗：" + json.error)
        return
      }

      // ⭐ 更新本卡片的 UI
      setStatus(json.status)

      // ⭐ 通知父層刷新
      if (onStatusUpdated) onStatusUpdated()

    } catch (err) {
      console.error("⚠️ 狀態更新錯誤：", err)
    }
  }

  // 手勢滑動
  let touchStartX = 0
  let touchEndX = 0

  const handleTouchStart = (e: any) =>
    (touchStartX = e.changedTouches[0].clientX)

  const handleTouchEnd = (e: any) => {
    touchEndX = e.changedTouches[0].clientX
    if (touchEndX - touchStartX > 50)
      setCurrentIndex((prev) => (prev === 0 ? o.style_imgs.length - 1 : prev - 1))

    if (touchStartX - touchEndX > 50)
      setCurrentIndex((prev) =>
        prev === o.style_imgs.length - 1 ? 0 : prev + 1
      )
  }

  return (
    <div className="bg-white border border-brand-200 rounded-2xl overflow-hidden hover:shadow-soft transition relative">

      {/* 編輯按鈕 */}
      <Link
        href={`/orders/${o.id}/edit`}
        className="absolute top-2 right-2 bg-white/80 backdrop-blur px-2 py-1 rounded-lg border border-brand-300 text-brand-700 text-xs hover:bg-brand-100 flex items-center gap-1"
      >
        <Pencil size={14} /> 編輯
      </Link>

      {/* 封面圖 */}
      <img
        src={o.style_imgs?.[0] || "/placeholder.png"}
        className="w-full h-40 object-cover"
        onClick={() => {
          setCurrentIndex(0)
          setActiveImage(o.style_imgs?.[0] ?? null)
        }}
      />

      <div className="p-4 space-y-2">
        {/* 客戶 & 日期 */}
        <div className="flex justify-between items-center">
          <h3 className="font-bold text-lg text-brand-900">{o.customer}</h3>
          <span className="text-sm text-brand-600">
            {new Date(o.created_at).toLocaleDateString("zh-TW")}
          </span>
        </div>

        {/* 狀態 */}
        <div className="flex justify-between items-center pt-1">
          <span
            className={[
              "px-2.5 py-1 rounded-full text-xs border font-medium",
              status === "已寄出" && "bg-blue-100 text-blue-800 border-blue-300",
              status === "已付定金" && "bg-yellow-100 text-yellow-800 border-yellow-300",
              status === "已下單" && "bg-orange-100 text-orange-800 border-orange-300",
            ]
              .filter(Boolean)
              .join(" ")}
          >
            {status}
          </span>

          <span className="text-brand-700 font-bold">
            {twCurrency(o.price)}
          </span>
        </div>

  
        {/* ⭐ 狀態往後推按鈕 */}
        <button
          onClick={handleNextStatus}
          disabled={STATUSES.indexOf(o.status) === STATUSES.length - 1}
          className="w-full mt-2 py-1.5 text-sm rounded-lg 
             bg-blue-100 text-blue-700 border border-blue-300 
             hover:bg-blue-200 disabled:opacity-40 disabled:cursor-not-allowed transition"
        >
          ➡️ {(() => {
            const idx = STATUSES.indexOf(o.status)
            const next = STATUSES[idx + 1]
            return next ? `${next}` : "已是最後狀態"
          })()}
        </button>


        {/* 詳細資訊開關 */}
        <button
          onClick={() => setOpen(!open)}
          className="w-full flex justify-center items-center gap-1 text-brand-700 text-sm mt-2 hover:text-brand-900"
        >
          {open ? <>收合詳細 <ChevronUp size={16} /></> : <>顯示詳細 <ChevronDown size={16} /></>}
        </button>

        {open && (
          <div className="mt-2 space-y-1 text-sm text-brand-700">
            <div>
              尺寸：<span className="font-semibold text-brand-900">{o.size}</span>
              {o.size === "客製" && o.custom_size_note && (
                <span className="ml-1 text-xs text-brand-600">（{o.custom_size_note}）</span>
              )}
            </div>

            <div>形狀：<span className="font-semibold text-brand-900">{o.shape}</span></div>
            <div>數量：<span className="font-semibold text-brand-900">{o.quantity}</span></div>
            <div>備註：<span className="font-semibold text-brand-900">{o.note || "—"}</span></div>
          </div>
        )}
      </div>

      {/* 放大圖片 Modal */}
      {activeImage && (
        <div
          onClick={() => setActiveImage(null)}
          className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center"
        >
          <div
            className="relative w-[90%] max-w-3xl"
            onClick={(e) => e.stopPropagation()}
            onTouchStart={handleTouchStart}
            onTouchEnd={handleTouchEnd}
          >
            <img
              src={o.style_imgs[currentIndex]}
              className="w-full max-h-[80vh] object-contain rounded-xl shadow-2xl"
            />

            <button
              onClick={() => setActiveImage(null)}
              className="absolute top-3 right-3 bg-black/70 text-white px-3 py-1 rounded-full text-sm"
            >
              ✕
            </button>

            {/* ← 左箭頭 */}
            {o.style_imgs.length > 1 && (
              <button
                onClick={() =>
                  setCurrentIndex((prev) =>
                    prev === 0 ? o.style_imgs.length - 1 : prev - 1
                  )
                }
                className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/60 text-white rounded-full p-3 hover:bg-black/80"
              >
                ←
              </button>
            )}

            {/* → 右箭頭 */}
            {o.style_imgs.length > 1 && (
              <button
                onClick={() =>
                  setCurrentIndex((prev) =>
                    prev === o.style_imgs.length - 1 ? 0 : prev + 1
                  )
                }
                className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/60 text-white rounded-full p-3 hover:bg-black/80"
              >
                →
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
