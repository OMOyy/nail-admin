// src/components/OrderFilterBar.tsx
import { STATUSES } from "@/lib/constants"

export default function OrderFilterBar({
  tab,
  setTab,
}: {
  tab: "全部" | (typeof STATUSES)[number]
  setTab: (t: "全部" | (typeof STATUSES)[number]) => void
}) {
  return (
    <div className="flex flex-wrap gap-2 mb-6">
      {(["全部", ...STATUSES] as const).map((t) => (
        <button
          key={t}
          onClick={() => setTab(t)}
          className={[
            "px-4 py-2 rounded-xl border transition font-medium",
            tab === t
              ? "bg-brand-400 border-brand-500 text-white shadow"
              : "bg-brand-100 border-brand-300 text-brand-700 hover:bg-brand-200",
          ].join(" ")}
        >
          {t}
        </button>
      ))}
    </div>
  )
}
