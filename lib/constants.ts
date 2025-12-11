import type { OrderStatus } from "@/types/order"

export const STATUSES: OrderStatus[] = [
  "已付定金",
  "已下單",
  "已寄出",
]
// 訂單篩選標籤
export const TABS = [ ...STATUSES] as const

// Tab 的型別
export type TabKey = typeof TABS[number]
export const SHAPES = [
  "短圓",
  "短方圓",
  "短方",
  "短梯",
  "梯形",
  "橢圓",
  "杏仁",
] as const
export const SIZE_LABELS: Record<string, string> = {
  "XS": "特小",
  "S": "小",
  "M": "中",
  "L": "大",
  "XL": "特大",
  "客製": "客製尺寸",
}

export const SHAPE_LABELS: Record<string, string> = {
  "短圓": "短圓形",
  "方形": "方形",
  "杏仁": "杏仁形",
  "棺型": "棺型",
  "客製": "客製形狀",
}

export const SIZES = ["XS", "S", "M", "L", "客製"] as const


