// src/components/OrderFilterBar.tsx
import { TABS, type TabKey } from "@/lib/constants"

export default function OrderFilterBar({
  tab,
  setTab,
}: {
  tab: TabKey
  setTab: (t: TabKey) => void
}) {
  return (
    <div className="flex flex-wrap gap-2 mb-6">
      {TABS.map((t) => (
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
