// src/components/ChartSparkline.tsx
export type Point = { x: number; y: number }

export default function ChartSparkline({
  points,
  width = 320,
  height = 80,
  stroke = "#FDA65D", // brand-400
}: {
  points: Point[]
  width?: number
  height?: number
  stroke?: string
}) {
  if (!points.length) {
    return (
      <div className="grid h-20 place-items-center rounded-xl border border-brand-200 text-brand-600">
        無資料
      </div>
    )
  }

  const xs = points.map((p) => p.x)
  const ys = points.map((p) => p.y)
  const minX = Math.min(...xs)
  const maxX = Math.max(...xs)
  const minY = Math.min(...ys)
  const maxY = Math.max(...ys)

  const nx = (x: number) =>
    ((x - minX) / (maxX - minX || 1)) * (width - 16) + 8
  const ny = (y: number) =>
    height - (((y - minY) / (maxY - minY || 1)) * (height - 16) + 8)

  const d = points
    .map((p, i) => `${i ? "L" : "M"} ${nx(p.x)},${ny(p.y)}`)
    .join(" ")

  return (
    <svg width="100%" viewBox={`0 0 ${width} ${height}`} className="overflow-visible">
      <rect x="0" y="0" width={width} height={height} rx="10" fill="white" />
      <path d={d} fill="none" stroke={stroke} strokeWidth="1.5" />
      {points.map((p, i) => (
        <circle key={i} cx={nx(p.x)} cy={ny(p.y)} r="2.5" fill={stroke} />
      ))}
    </svg>
  )
}
