const fmt = n => '₹' + Number(n ?? 0).toLocaleString('en-IN', { maximumFractionDigits: 2 })
const fmtN = n => Number(n ?? 0).toLocaleString('en-IN')

const cards = [
  { revenueKey: 'totalRevenue', label: 'Total Revenue', color: 'from-blue-500 to-blue-600', icon: '💰' },
  { revenueKey: 'successRevenue', countKey: 'successCount', label: 'Success Revenue', color: 'from-green-500 to-green-600', icon: '✅' },
  { revenueKey: 'renewRevenue', countKey: 'renewCount', label: 'Renewal Revenue', color: 'from-purple-500 to-purple-600', icon: '🔄' },
]

export default function SummaryCards({ totals }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
      {cards.map(({ revenueKey, countKey, label, color, icon }) => (
        <div key={revenueKey} className={`bg-gradient-to-br ${color} rounded-2xl p-5 text-white shadow-lg`}>
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium opacity-90">{label}</span>
            <span className="text-2xl">{icon}</span>
          </div>
          <div className="text-2xl font-bold">{fmt(totals[revenueKey])}</div>
          {countKey && (
            <div className="mt-2 flex items-center gap-1.5 text-sm opacity-90">
              <span>👤</span>
              <span>{fmtN(totals[countKey])} customers</span>
            </div>
          )}
        </div>
      ))}
    </div>
  )
}
