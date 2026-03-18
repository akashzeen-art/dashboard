import { useState } from 'react'
import HourlyTable from './HourlyTable'
import { exportToCSV, totalRenew } from '../services/api'

const fmt = n => '₹' + Number(n ?? 0).toLocaleString('en-IN', { maximumFractionDigits: 2 })
const fmtN = n => Number(n ?? 0).toLocaleString('en-IN')

function portalCounts(hours = []) {
  return hours.reduce(
    (acc, h) => ({
      total: acc.total + (h.init ?? 0),
      success: acc.success + (h.success ?? 0),
      renew: acc.renew + totalRenew(h.renew),
    }),
    { total: 0, success: 0, renew: 0 }
  )
}

function MetaBadge({ label, value, color = 'gray' }) {
  const colors = {
    gray: 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300',
    blue: 'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300',
    green: 'bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-300',
    purple: 'bg-purple-50 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300',
  }
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-medium ${colors[color]}`}>
      <span className="opacity-60">{label}</span>
      <span className="font-semibold">{value}</span>
    </span>
  )
}

export default function PortalTable({ portals, topPortalId }) {
  if (!portals.length) return (
    <div className="text-center py-12 text-gray-400">No portals match your search.</div>
  )

  const handleExport = (portal) => {
    const rows = (portal.hours ?? []).map(h => ({
      hour: `${String(h.hour).padStart(2,'0')}:00`,
      init: h.init,
      success: h.success,
      parking: h.parking,
      renewTotal: totalRenew(h.renew),
      renewBreakdown: Object.entries(h.renew ?? {}).map(([k,v]) => `${k}:${v}`).join(' | '),
    }))
    exportToCSV(rows, `portal_${portal.portalId}_${portal.portalName}_hourly.csv`)
  }

  return (
    <div className="space-y-6">
      {portals.map(portal => {
        const isTop = portal.portalId === topPortalId
        return (
          <div
            key={portal.portalId}
            className={`bg-white dark:bg-gray-900 rounded-2xl shadow-sm border-2 ${
              isTop ? 'border-yellow-400 dark:border-yellow-500' : 'border-gray-100 dark:border-gray-800'
            } overflow-hidden`}
          >
            {/* ── Portal Header ── */}
            <div className={`px-5 py-4 border-b border-gray-100 dark:border-gray-800 ${
              isTop ? 'bg-yellow-50/50 dark:bg-yellow-900/10' : 'bg-gray-50/50 dark:bg-gray-800/20'
            }`}>
              <div className="flex items-start justify-between gap-3 flex-wrap">
                <div className="flex items-center gap-3">
                  {isTop && <span className="text-yellow-500 text-xl" title="Top Performing">🏆</span>}
                  <div>
                    {/* Portal Name + ID */}
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-bold text-gray-900 dark:text-white text-base">
                        {portal.portalName ?? `Portal ${portal.portalId}`}
                      </h3>
                      <MetaBadge label="ID" value={portal.portalId} color="blue" />
                      {isTop && <MetaBadge label="" value="Top Portal" color="purple" />}
                    </div>
                    {/* Meta row */}
                    <div className="flex flex-wrap gap-2 mt-1.5">
                      <MetaBadge label="PG" value={portal.pgName} color="gray" />
                      <MetaBadge label="DSP" value={portal.dsp} color="gray" />
                      {portal.portalSuccessUrl && (
                        <a
                          href={`https://${portal.portalSuccessUrl}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-medium bg-teal-50 dark:bg-teal-900/30 text-teal-700 dark:text-teal-300 hover:underline"
                        >
                          🔗 {portal.portalSuccessUrl}
                        </a>
                      )}
                    </div>
                  </div>
                </div>

                {/* Revenue + Count chips */}
                {(() => { const c = portalCounts(portal.hours); return (
                <div className="flex flex-wrap gap-2 items-center">
                  <div className="text-center px-3 py-1.5 rounded-xl bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800">
                    <p className="text-xs text-blue-500 dark:text-blue-400 font-medium">Total</p>
                    <p className="text-sm font-bold text-blue-700 dark:text-blue-300">{fmt(portal.totalRevenue)}</p>

                  </div>
                  <div className="text-center px-3 py-1.5 rounded-xl bg-green-50 dark:bg-green-900/20 border border-green-100 dark:border-green-800">
                    <p className="text-xs text-green-500 dark:text-green-400 font-medium">Success</p>
                    <p className="text-sm font-bold text-green-700 dark:text-green-300">{fmt(portal.successRevenue)}</p>
                    <p className="text-xs text-green-400 dark:text-green-500 mt-0.5">👤 {fmtN(c.success)}</p>
                  </div>
                  <div className="text-center px-3 py-1.5 rounded-xl bg-purple-50 dark:bg-purple-900/20 border border-purple-100 dark:border-purple-800">
                    <p className="text-xs text-purple-500 dark:text-purple-400 font-medium">Renew</p>
                    <p className="text-sm font-bold text-purple-700 dark:text-purple-300">{fmt(portal.renewRevenue)}</p>
                    <p className="text-xs text-purple-400 dark:text-purple-500 mt-0.5">👤 {fmtN(c.renew)}</p>
                  </div>
                  <button
                    onClick={() => handleExport(portal)}
                    className="text-xs px-3 py-1.5 bg-white dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 border border-gray-200 dark:border-gray-700 rounded-lg text-gray-600 dark:text-gray-300 transition-colors"
                  >
                    ⬇ CSV
                  </button>
                </div>
                )})()} 
              </div>
            </div>

            {/* ── Hourly Breakdown ── */}
            <div className="px-5 py-4">
              <HourlyTable hours={portal.hours} />
            </div>
          </div>
        )
      })}
    </div>
  )
}
