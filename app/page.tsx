// src/app/page.tsx
import StatCard from "@/components/StatCard"

export default function HomePage() {
  return (
    <section className="space-y-6">
      <h2 className="text-lg font-bold">儀表板</h2>
      <div className="grid sm:grid-cols-3 gap-4">
        <StatCard title="本月營收" value="NT$ 120,000" />
        <StatCard title="完成率" value="68%" />
        <StatCard title="熱門甲型" value="杏仁型" />
      </div>
    </section>
  )
}
