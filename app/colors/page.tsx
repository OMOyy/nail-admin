export default function ColorsPage() {
  const brandColors = [
    { name: "brand-50", hex: "#FFF6EA" },
    { name: "brand-100", hex: "#FFEBD3" },
    { name: "brand-200", hex: "#FFDEB4" },
    { name: "brand-300", hex: "#FFD08E" },
    { name: "brand-400", hex: "#FDA65D" },
    { name: "brand-500", hex: "#F8903E" },
    { name: "brand-600", hex: "#F77F00" },
    { name: "brand-700", hex: "#CC6700" },
    { name: "brand-800", hex: "#A65200" },
    { name: "brand-900", hex: "#733800" },
  ]

  return (
    <section className="min-h-screen bg-brand-50 p-8">
      <h1 className="text-2xl font-bold text-brand-900 mb-6">
        🎨 品牌顏色展示
      </h1>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {brandColors.map(({ name, hex }) => (
          <div
            key={name}
            className="border border-brand-200 rounded-xl overflow-hidden shadow-soft"
          >
            <div
              className={`h-20 bg-${name}`}
              style={{ backgroundColor: hex }}
            />
            <div className="p-3 flex flex-col items-start">
              <span className="font-semibold text-brand-900">{name}</span>
              <span className="text-sm text-brand-700">{hex}</span>
            </div>
          </div>
        ))}
      </div>

      <h2 className="text-xl font-bold text-brand-900 mt-10 mb-4">陰影與圓角範例</h2>
      <div className="flex flex-wrap gap-6">
        <div className="bg-white rounded-xl2 shadow-soft p-6 border border-brand-200">
          <h3 className="font-bold text-brand-700">shadow-soft</h3>
          <p className="text-brand-600">柔和橘陰影</p>
        </div>

        <div className="bg-gradient-to-br from-brand-400 to-brand-200 text-white p-6 rounded-xl2 shadow-soft">
          <h3 className="font-bold">漸層範例</h3>
          <p>from-brand-400 → to-brand-200</p>
        </div>
      </div>
    </section>
  )
}
