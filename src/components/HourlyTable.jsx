import { useState } from 'react'
import { totalRenew } from '../services/api'

function buildFullGrid(hours) {
  const map = {}
  ;(hours ?? []).forEach(row => { map[row.hour] = row })
  return Array.from({ length: 24 }, (_, h) => ({
    hour: h,
    init: map[h]?.init ?? 0,
    success: map[h]?.success ?? 0,
    parking: map[h]?.parking ?? 0,
    renew: map[h]?.renew ?? {},
    hasData: !!map[h],
  }))
}

const SLOT_FILTERS = [
  { label: 'All 24h', fn: () => true },
  { label: '☀️ Day 06–18', fn: h => h >= 6 && h < 18 },
  { label: '🌙 Night 18–06', fn: h => h >= 18 || h < 6 },
]

export default function HourlyTable({ hours }) {
  const [open, setOpen] = useState(false)
  const [filterIdx, setFilterIdx] = useState(0)

  const grid = buildFullGrid(hours)
  const visible = grid.filter(row => SLOT_FILTERS[filterIdx].fn(row.hour))

  const totals = visible.reduce(
    (acc, row) => ({
      init: acc.init + row.init,
      success: acc.success + row.success,
      parking: acc.parking + row.parking,
      renew: acc.renew + totalRenew(row.renew),
    }),
    { init: 0, success: 0, parking: 0, renew: 0 }
  )

  const activeHours = visible.filter(r => r.hasData).length

  return (
    <div>
      <button
        onClick={() => setOpen(o => !o)}
        className="flex items-center gap-2 text-sm font-semibold text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors"
      >
        <span className={`transition-transform ${open ? 'rotate-90' : ''}`}>▶</span>
        Hourly Breakdown
        <span className="font-normal text-gray-400 text-xs">({activeHours} active / 24 slots)</span>
      </button>

      {open && (
        <div className="mt-3">
          {/* Filter tabs */}
          <div className="flex gap-1 mb-3 flex-wrap">
            {SLOT_FILTERS.map((f, i) => (
              <button
                key={i}
                onClick={() => setFilterIdx(i)}
                className={`px-3 py-1 text-xs rounded-lg font-medium transition-colors ${
                  filterIdx === i
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
                }`}
              >
                {f.label}
              </button>
            ))}
            <span className="ml-auto text-xs text-gray-400 self-center">
              {activeHours} / {visible.length} slots with data
            </span>
          </div>

          <div className="overflow-x-auto rounded-xl border border-gray-100 dark:border-gray-700">
            <table className="w-full text-xs">
              <thead className="bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300">
                <tr>
                  <th className="px-3 py-2.5 text-left font-semibold whitespace-nowrap">Hour Slot</th>
                  <th className="px-3 py-2.5 text-right font-semibold">Init</th>
                  <th className="px-3 py-2.5 text-right font-semibold">Success</th>
                  <th className="px-3 py-2.5 text-right font-semibold">Parking</th>
                  <th className="px-3 py-2.5 text-right font-semibold">Renew Total</th>
                  <th className="px-3 py-2.5 text-left font-semibold">Renew Breakdown</th>
                </tr>
              </thead>
              <tbody>
                {visible.map((row) => {
                  const rc = totalRenew(row.renew)
                  const renewEntries = Object.entries(row.renew)
                  const isEmpty = !row.hasData

                  return (
                    <tr
                      key={row.hour}
                      className={`border-t border-gray-100 dark:border-gray-700 ${
                        isEmpty
                          ? 'opacity-30'
                          : 'hover:bg-blue-50/60 dark:hover:bg-blue-900/10'
                      }`}
                    >
                      {/* Hour slot */}
                      <td className="px-3 py-2 font-mono font-bold text-blue-600 dark:text-blue-400 whitespace-nowrap">
                        {String(row.hour).padStart(2, '0')}:00
                        <span className="text-gray-400 font-normal mx-1">–</span>
                        {String((row.hour + 1) % 24).padStart(2, '0')}:00
                      </td>

                      {/* Init */}
                      <td className={`px-3 py-2 text-right font-medium ${row.init > 0 ? 'text-gray-800 dark:text-gray-100' : 'text-gray-400'}`}>
                        {row.init}
                      </td>

                      {/* Success */}
                      <td className={`px-3 py-2 text-right font-semibold ${row.success > 0 ? 'text-green-600 dark:text-green-400' : 'text-gray-400'}`}>
                        {row.success}
                      </td>

                      {/* Parking */}
                      <td className={`px-3 py-2 text-right ${row.parking > 0 ? 'text-yellow-600 dark:text-yellow-400' : 'text-gray-400'}`}>
                        {row.parking}
                      </td>

                      {/* Renew Total */}
                      <td className={`px-3 py-2 text-right font-semibold ${rc > 0 ? 'text-purple-600 dark:text-purple-400' : 'text-gray-400'}`}>
                        {rc}
                      </td>

                      {/* Renew Breakdown — show each plan:count */}
                      <td className="px-3 py-2">
                        {renewEntries.length > 0 ? (
                          <div className="flex flex-wrap gap-1">
                            {renewEntries.map(([plan, count]) => (
                              <span
                                key={plan}
                                className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-300 text-xs font-medium whitespace-nowrap"
                              >
                                {plan}
                                <span className="bg-purple-600 text-white rounded px-1 font-bold">{count}</span>
                              </span>
                            ))}
                          </div>
                        ) : (
                          <span className="text-gray-300 dark:text-gray-600">—</span>
                        )}
                      </td>
                    </tr>
                  )
                })}

                {/* Totals row */}
                <tr className="border-t-2 border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-800/70 font-bold">
                  <td className="px-3 py-2.5 text-gray-500 dark:text-gray-400 uppercase tracking-wide text-xs">Total</td>
                  <td className="px-3 py-2.5 text-right text-gray-800 dark:text-gray-100">{totals.init}</td>
                  <td className="px-3 py-2.5 text-right text-green-600 dark:text-green-400">{totals.success}</td>
                  <td className="px-3 py-2.5 text-right text-yellow-600 dark:text-yellow-400">{totals.parking}</td>
                  <td className="px-3 py-2.5 text-right text-purple-600 dark:text-purple-400">{totals.renew}</td>
                  <td className="px-3 py-2.5 text-gray-400 text-xs">across all plans</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
