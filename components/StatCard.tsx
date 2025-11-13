// src/components/StatCard.tsx
export default function StatCard({ title, value }: { title: string; value: string }) {
  return (
    <div className="rounded-2xl border border-brand-200 bg-white p-4">
      <div className="text-brand-700 text-xs">{title}</div>
      <div className="text-lg font-bold mt-1 text-brand-900">{value}</div>
    </div>
  )
}
