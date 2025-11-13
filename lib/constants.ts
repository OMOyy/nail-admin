import type { OrderStatus } from "@/types/order"

export const STATUSES: OrderStatus[] = [
  "未付定金",
  "已付定金",
  "已完成未下單",
  "已下單",
  "已寄出",
]

export const SHAPES = [
  "短圓",
  "短方圓",
  "短方",
  "短梯",
  "梯形",
  "橢圓",
  "杏仁",
] as const

export const SIZES = ["XS", "S", "M", "L", "客製"] as const
