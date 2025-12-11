export type OrderStatus =
  | "已付定金"
  | "已下單"
  | "已寄出"

export type Order = {
  id: string
  customer: string
  size: "XS" | "S" | "M" | "L" | "客製"
  custom_size_note?: string
  shape: "短圓" | "短方圓" | "短方" | "短梯" | "梯形" | "橢圓" | "杏仁"
  style_imgs: string[]
  quantity: number
  note?: string
  status: OrderStatus
  price: number
  created_at: string
}
