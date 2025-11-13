"use client"
import { useEffect, useState } from "react"
import { useRouter, useParams } from "next/navigation"
import { supabase } from "@/lib/supabaseClient"
import { SIZES, SHAPES, STATUSES } from "@/lib/constants"
import type { Order } from "@/types/order"

export default function EditOrderPage() {
  const router = useRouter()
  const { id } = useParams()
  const [form, setForm] = useState<Order | null>(null)
  const [previews, setPreviews] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [deleting, setDeleting] = useState(false)
  const [activeImage, setActiveImage] = useState<string | null>(null)
  // ✅ 讀取訂單
  useEffect(() => {
    const fetchOrder = async () => {
      const { data, error } = await supabase.from("orders").select("*").eq("id", id).single()
      if (error) {
        console.error(error)
      } else if (data) {
        setForm(data)
        setPreviews(data.style_imgs || [])
      }
      setLoading(false)
    }
    fetchOrder()
  }, [id])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
  const target = e.target as HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
  const { name, value } = target
  setForm((prev) => (prev ? { ...prev, [name]: value } : prev))
}


  // ✅ 多檔上傳
  const handleFilesChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files) return
    Array.from(files).forEach((file) => {
      const reader = new FileReader()
      reader.onload = () => {
        const base64 = reader.result as string
        setPreviews((prev) => [...prev, base64])
      }
      reader.readAsDataURL(file)
    })
  }

  // ✅ 刪除單張圖片
  const handleRemoveImage = (index: number) => {
    setPreviews((prev) => prev.filter((_, i) => i !== index))
  }

  // ✅ 儲存修改
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form) return
    const { error } = await supabase
      .from("orders")
      .update({ ...form, style_imgs: previews })
      .eq("id", id)

    if (error) alert(error.message)
    else router.push("/orders")
  }

  // ✅ 刪除整筆訂單
  const handleDelete = async () => {
    if (!form) return
    const confirmed = confirm(`確定要刪除「${form.customer}」的訂單嗎？`)
    if (!confirmed) return

    setDeleting(true)
    const { error } = await supabase.from("orders").delete().eq("id", form.id)
    setDeleting(false)

    if (error) {
      alert("刪除失敗：" + error.message)
    } else {
      alert("✅ 訂單已刪除")
      router.push("/orders")
    }
  }

  if (loading) return <div className="text-center py-10 text-brand-700">載入中...</div>
  if (!form) return <div className="text-center py-10 text-brand-700">找不到此訂單</div>

  return (
    <section className="max-w-2xl mx-auto bg-white p-6 rounded-2xl shadow-soft border border-brand-200">
      <h2 className="text-xl font-bold text-brand-800 mb-4">編輯訂單</h2>

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* 客戶姓名 */}
        <div>
          <label className="block text-sm font-medium text-brand-700">客戶姓名</label>
          <input
            name="customer"
            value={form.customer}
            onChange={handleChange}
            className="mt-1 w-full border border-brand-200 rounded-lg p-2"
          />
        </div>

        {/* 尺寸 + 形狀 */}
        <div className="flex gap-4">
          <div className="flex-1">
            <label className="block text-sm font-medium text-brand-700">尺寸</label>
            <select
              name="size"
              value={form.size}
              onChange={handleChange}
              className="mt-1 w-full border border-brand-200 rounded-lg p-2"
            >
              {SIZES.map((s) => (
                <option key={s}>{s}</option>
              ))}
            </select>
          </div>

          <div className="flex-1">
            <label className="block text-sm font-medium text-brand-700">形狀</label>
            <select
              name="shape"
              value={form.shape}
              onChange={handleChange}
              className="mt-1 w-full border border-brand-200 rounded-lg p-2"
            >
              {SHAPES.map((s) => (
                <option key={s}>{s}</option>
              ))}
            </select>
          </div>
        </div>

        {/* ✅ 圖片上傳 + 刪除 */}
        <div>
          <label className="block text-sm font-medium text-brand-700 mb-1">款式圖片</label>
          <input
            type="file"
            multiple
            onChange={handleFilesChange}
            className="text-sm text-brand-700 file:mr-3 file:py-2 file:px-4 file:rounded-lg 
                       file:border-0 file:bg-brand-400 file:text-white hover:file:bg-brand-500"
          />

          <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 mt-3">
            {previews.map((src, idx) => (
              <div key={idx} className="relative group">
                <img
                  src={src}
                  alt={`preview-${idx}`}
                  onClick={() => setActiveImage(src)}
                  className="w-full h-24 object-cover rounded-lg border border-brand-200 shadow-sm cursor-pointer hover:scale-[1.03] transition"
                />
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation()
                    handleRemoveImage(idx)
                  }}
                  className="absolute top-1 right-1 bg-black/60 text-white text-xs rounded-full px-2 py-0.5  group-hover:opacity-100 transition"
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* 數量與價格 */}
        <div className="flex gap-4">
          <div className="flex-1">
            <label className="block text-sm font-medium text-brand-700">數量</label>
            <input
              type="number"
              name="quantity"
              value={form.quantity}
              onChange={handleChange}
              className="mt-1 w-full border border-brand-200 rounded-lg p-2"
            />
          </div>
          <div className="flex-1">
            <label className="block text-sm font-medium text-brand-700">價格</label>
            <input
              type="number"
              name="price"
              value={form.price}
              onChange={handleChange}
              className="mt-1 w-full border border-brand-200 rounded-lg p-2"
            />
          </div>
        </div>

        {/* 備註欄位 */}
        <div>
          <label className="block text-sm font-medium text-brand-700">備註</label>
          <textarea
            name="note"
            value={form.note || ""}
            onChange={handleChange}
            rows={3}
            placeholder="例如：貼鑽、跳色、法式設計..."
            className="mt-1 w-full border border-brand-200 rounded-lg p-2 text-sm focus:ring-2 focus:ring-brand-300 focus:outline-none"
          />
        </div>

        {/* 狀態 */}
        <div>
          <label className="block text-sm font-medium text-brand-700">狀態</label>
          <select
            name="status"
            value={form.status}
            onChange={handleChange}
            className="mt-1 w-full border border-brand-200 rounded-lg p-2"
          >
            {STATUSES.map((s) => (
              <option key={s}>{s}</option>
            ))}
          </select>
        </div>

        {/* ✅ 按鈕區 */}
        <div className="pt-6 flex flex-col sm:flex-row justify-between gap-3 border-t border-brand-100 mt-6">
          <button
            type="button"
            onClick={() => router.back()}
            className="px-4 py-2 rounded-lg border border-brand-300 text-brand-700 hover:bg-brand-100"
          >
            返回
          </button>

          <div className="flex gap-3">
            <button
              type="button"
              onClick={handleDelete}
              disabled={deleting}
              className="px-4 py-2 rounded-lg bg-red-100 text-red-700 border border-red-300 hover:bg-red-200 disabled:opacity-50"
            >
              {deleting ? "刪除中..." : "刪除訂單"}
            </button>

            <button
              type="submit"
              className="px-4 py-2 rounded-lg bg-brand-400 text-white hover:bg-brand-500"
            >
              儲存修改
            </button>
          </div>
        </div>
      </form>
      {/* ✅ 放大圖片 Modal */}
      {activeImage && (
        <div
          onClick={() => setActiveImage(null)}
          className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center"
        >
          <div
            className="relative max-w-3xl w-[90%] rounded-lg overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <img
              src={activeImage}
              alt="preview-large"
              className="w-full h-auto max-h-[80vh] object-contain rounded-lg shadow-2xl animate-in fade-in zoom-in"
            />
            <button
              onClick={() => setActiveImage(null)}
              className="absolute top-2 right-2 bg-black/70 text-white rounded-full px-3 py-1 text-sm hover:bg-black/90 transition"
            >
              ✕
            </button>
          </div>
        </div>
      )}
    </section>
  )
}
