// src/components/StatCard.tsx
import { ReactNode } from "react"

export default function StatCard({
  title,
  value,
  hint,
  suffix,
  icon,
}: {
  title: string
  value: string | number
  hint?: string
  suffix?: string
  icon?: ReactNode
}) {
  return (
    <div className="rounded-2xl border border-brand-200 bg-white p-4 shadow-soft">
      <div className="flex items-center justify-between">
        <div className="text-brand-700 text-xs">{title}</div>
        {icon ? <div className="text-brand-500">{icon}</div> : null}
      </div>

      <div className="text-lg font-bold mt-1 text-brand-900 flex items-center gap-1">
        {value}
        {suffix ? <span className="text-brand-700 text-sm">{suffix}</span> : null}
      </div>

      {hint ? <div className="text-brand-600 text-xs mt-1">{hint}</div> : null}
    </div>
  )
}
