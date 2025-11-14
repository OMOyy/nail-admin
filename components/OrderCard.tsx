"use client"
import { useState } from "react"
import Link from "next/link"
import type { Order } from "@/types/order"
import { ChevronDown, ChevronUp, Pencil } from "lucide-react"

const twCurrency = (n: number) =>
  new Intl.NumberFormat("zh-TW", {
    style: "currency",
    currency: "TWD",
    maximumFractionDigits: 0,
  }).format(n)

export default function OrderCard({ o }: { o: Order }) {
  const [open, setOpen] = useState(false)
  const [activeImage, setActiveImage] = useState<string | null>(null)
  const [currentIndex, setCurrentIndex] = useState(0)

  // touch 手勢
  let touchStartX = 0
  let touchEndX = 0

  const handleTouchStart = (e :any) => (touchStartX = e.changedTouches[0].clientX)
  const handleTouchEnd = (e :any) => {
    touchEndX = e.changedTouches[0].clientX
    if (touchEndX - touchStartX > 50) {
      // 往右滑 → 上一張
      setCurrentIndex((prev) =>
        prev === 0 ? o.style_imgs.length - 1 : prev - 1
      )
    }
    if (touchStartX - touchEndX > 50) {
      // 往左滑 → 下一張
      setCurrentIndex((prev) =>
        prev === o.style_imgs.length - 1 ? 0 : prev + 1
      )
    }
  }

  return (
    <div className="bg-white border border-brand-200 rounded-2xl overflow-hidden hover:shadow-soft transition relative">

      {/* 編輯按鈕 */}
      <Link
        href={`/orders/${o.id}/edit`}
        className="absolute top-2 right-2 bg-white/80 backdrop-blur px-2 py-1 rounded-lg border border-brand-300 text-brand-700 text-xs hover:bg-brand-100 flex items-center gap-1"
      >
        <Pencil size={14} />
        編輯
      </Link>

      {/* 封面圖 */}
      <img
        src={o.style_imgs?.[0] || "/placeholder.png"}
        alt="款式"
        className="w-full h-40 object-cover"
        onClick={() => {
          setCurrentIndex(0)
          setActiveImage(o.style_imgs?.[0] ?? null)
        }}

      />

      <div className="p-4 space-y-2">
        {/* 客戶 + 日期 */}
        <div className="flex justify-between items-center">
          <h3 className="font-bold text-lg text-brand-900">{o.customer}</h3>
          <span className="text-sm text-brand-600">
            {new Date(o.created_at).toLocaleDateString("zh-TW")}
          </span>
        </div>

        {/* 狀態 + 價格 */}
        <div className="flex justify-between items-center pt-1">
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

          <span className="text-brand-700 font-bold">
            {twCurrency(o.price)}
          </span>
        </div>

        {/* 下拉開闔按鈕 */}
        <button
          onClick={() => setOpen(!open)}
          className="w-full flex justify-center items-center gap-1 text-brand-700 text-sm mt-2 hover:text-brand-900"
        >
          {open ? (
            <>
              收合詳細 <ChevronUp size={16} />
            </>
          ) : (
            <>
              顯示詳細 <ChevronDown size={16} />
            </>
          )}
        </button>

        {/* 展開的詳細內容 */}
        {open && (
          <div className="mt-2 space-y-1 text-sm text-brand-700 animate-in fade-in">
            <div>
              尺寸：
              <span className="font-semibold text-brand-900">{o.size}</span>
              {o.size === "客製" && o.custom_size_note && (
                <span className="ml-1 text-xs text-brand-600">（{o.custom_size_note}）</span>
              )}
            </div>

            <div>
              形狀：<span className="font-semibold text-brand-900">{o.shape}</span>
            </div>

            <div>
              數量：<span className="font-semibold text-brand-900">{o.quantity}</span>
            </div>

            <div>
              備註：<span className="font-semibold text-brand-900">{o.note || "—"}</span>
            </div>
          </div>

        )}
      </div>
      {/* 放大圖片 Modal */}
      {activeImage !== null && (
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
            {/* 主圖片 */}
            <img
              src={o.style_imgs[currentIndex]}
              className="w-full max-h-[80vh] object-contain rounded-xl shadow-2xl"
            />

            {/* 關閉按鈕 */}
            <button
              onClick={() => setActiveImage(null)}
              className="absolute top-3 right-3 bg-black/70 text-white px-3 py-1 rounded-full text-sm"
            >
              ✕
            </button>

            {/* ← 左邊箭頭 */}
            {o.style_imgs.length > 1 && (
              <button
                onClick={() =>
                  setCurrentIndex((prev) =>
                    prev === 0 ? o.style_imgs.length - 1 : prev - 1
                  )
                }
                className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/60 text-white rounded-full p-3 hover:bg-black/80 transition"
              >
                ←
              </button>
            )}

            {/* → 右邊箭頭 */}
            {o.style_imgs.length > 1 && (
              <button
                onClick={() =>
                  setCurrentIndex((prev) =>
                    prev === o.style_imgs.length - 1 ? 0 : prev + 1
                  )
                }
                className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/60 text-white rounded-full p-3 hover:bg-black/80 transition"
              >
                →
              </button>
            )}

            {/* 底部縮圖列 */}
            {o.style_imgs.length > 1 && (
              <div className="flex gap-2 mt-4 justify-center">
                {o.style_imgs.map((src, idx) => (
                  <img
                    key={idx}
                    src={src}
                    onClick={() => setCurrentIndex(idx)}
                    className={`w-16 h-16 object-cover rounded-lg border cursor-pointer transition
                ${idx === currentIndex
                        ? "border-brand-400 scale-105"
                        : "border-white/30 opacity-70 hover:opacity-100"
                      }`}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      )}

    </div>

  )
}
