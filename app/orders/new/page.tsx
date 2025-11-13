"use client"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { SHAPES, SIZES, STATUSES } from "@/lib/constants"
import { supabase } from "../../../lib/supabaseClient";
type FormData = {
    customer: string
    size: string
    shape: string
    styleImgs: string[]
    quantity: number
    note: string
    customSizeNote: string
    status: string
    price: number
}

export default function NewOrderPage() {
    const router = useRouter()
    const [loading, setLoading] = useState(false)
    const [form, setForm] = useState<FormData>({
        customer: "",
        size: "M",
        shape: "短圓",
        styleImgs: [],
        quantity: 1,
        note: "",
        customSizeNote: "",
        status: "未付定金",
        price: 0,
    })

    const [previews, setPreviews] = useState<string[]>([])
    const [activeImage, setActiveImage] = useState<string | null>(null)

    /** ✅ 欄位輸入 */
    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target
        setForm((prev) => ({ ...prev, [name]: value }))
    }

    /** ✅ 多圖片上傳 */
    const handleFilesChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files
        if (!files?.length) return

        Array.from(files).forEach((file) => {
            const reader = new FileReader()
            reader.onload = () => {
                const base64 = reader.result as string
                setPreviews((prev) => [...prev, base64])
            }
            reader.readAsDataURL(file)
        })
    }

    /** ✅ 刪除圖片 */
    const removeImage = (idx: number) => {
        setPreviews((prev) => prev.filter((_, i) => i !== idx))
    }

    /** ✅ 送出表單 */
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)

        const { data, error } = await supabase.from("orders").insert([
            {
                customer: form.customer,
                size: form.size,
                custom_size_note: form.customSizeNote,
                shape: form.shape,
                style_imgs: previews,
                quantity: form.quantity,
                note: form.note,
                status: form.status,
                price: form.price,
            },
        ])

        if (error) {
            alert("❌ 新增失敗：" + error.message)
            setLoading(false)
            return
        }

        console.log("✅ 已新增訂單：", data)
        setLoading(false)
        router.push("/orders")
    }

    return (
        <section className="max-w-2xl mx-auto bg-white p-6 rounded-2xl shadow-soft border border-brand-200">
            <h2 className="text-xl font-bold text-brand-800 mb-4">新增訂單（多張圖片）</h2>

            <form onSubmit={handleSubmit} className="space-y-5">
                {/* 客戶姓名 */}
                <div>
                    <label className="block text-sm font-medium text-brand-700">客戶姓名</label>
                    <input
                        name="customer"
                        value={form.customer}
                        onChange={handleChange}
                        required
                        className="mt-1 w-full border border-brand-200 rounded-lg p-2 focus:ring-2 focus:ring-brand-300 focus:outline-none"
                    />
                </div>

                {/* 尺寸 + 形狀 */}
                <div className="flex flex-col gap-4 sm:flex-row">
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

                        {/* ✅ 客製尺寸輸入欄 */}
                        {form.size === "客製" && (
                            <input
                                type="text"
                                name="customSizeNote"
                                placeholder="請輸入客製尺寸說明"
                                value={form.customSizeNote}
                                onChange={handleChange}
                                className="mt-2 w-full border border-brand-200 rounded-lg p-2 text-sm focus:ring-2 focus:ring-brand-300 focus:outline-none"
                            />
                        )}
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

                {/* ✅ 多圖片上傳 */}
                <div>
                    <label className="block text-sm font-medium text-brand-700 mb-1">款式圖片（可多張）</label>
                    <input
                        type="file"
                        accept="image/*"
                        multiple
                        onChange={handleFilesChange}
                        className="text-sm text-brand-700 file:mr-3 file:py-2 file:px-4 file:rounded-lg 
                       file:border-0 file:bg-brand-400 file:text-white hover:file:bg-brand-500 cursor-pointer"
                    />

                    {previews.length > 0 && (
                        <div className="mt-3 grid grid-cols-3 sm:grid-cols-4 gap-3">
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
                                            removeImage(idx)
                                        }}
                                        className="absolute top-1 right-1 bg-black/60 text-white text-xs rounded-full px-2 py-0.5  group-hover:opacity-100 transition"
                                    >
                                        ✕
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* 數量 + 價格 */}
                <div className="flex gap-4">
                    <div className="flex-1">
                        <label className="block text-sm font-medium text-brand-700">數量</label>
                        <input
                            type="number"
                            name="quantity"
                            min={1}
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
                            min={0}
                            value={form.price}
                            onChange={handleChange}
                            className="mt-1 w-full border border-brand-200 rounded-lg p-2"
                        />
                    </div>
                </div>

                {/* 備註 */}
                <div>
                    <label className="block text-sm font-medium text-brand-700">備註</label>
                    <input
                        name="note"
                        value={form.note}
                        onChange={handleChange}
                        className="mt-1 w-full border border-brand-200 rounded-lg p-2"
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

                {/* 操作按鈕 */}
                <div className="pt-4 flex justify-end gap-3">
                    <button
                        type="button"
                        onClick={() => router.back()}
                        className="px-4 py-2 rounded-lg border border-brand-300 text-brand-700 hover:bg-brand-100"
                    >
                        取消
                    </button>
                    <button
                        type="submit"
                        disabled={loading}
                        className="px-4 py-2 rounded-lg bg-brand-400 text-white hover:bg-brand-500 disabled:opacity-50"
                    >
                        {loading ? "儲存中..." : "儲存訂單"}
                    </button>
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
