import { useState, useEffect, useCallback, useMemo } from 'react'
import { format } from 'date-fns'
import { fetchMISData, aggregateTotals } from '../services/api'
import SummaryCards from '../components/SummaryCards'
import Filters from '../components/Filters'
import Charts from '../components/Charts'
import PortalTable from '../components/PortalTable'

export default function Dashboard({ darkMode, setDarkMode, onLogout }) {
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [date, setDate] = useState(format(new Date(), 'yyyy-MM-dd'))
  const [search, setSearch] = useState('')
  const [lastUpdated, setLastUpdated] = useState(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const json = await fetchMISData(date)
      setData(Array.isArray(json) ? json : [])
      setLastUpdated(new Date())
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }, [date])

  useEffect(() => { load() }, [load])

  // Auto-refresh every 5 minutes
  useEffect(() => {
    const id = setInterval(load, 5 * 60 * 1000)
    return () => clearInterval(id)
  }, [load])

  const filtered = useMemo(() => {
    const q = search.toLowerCase()
    return data.filter(p =>
      !q ||
      (p.portalName ?? '').toLowerCase().includes(q) ||
      (p.pgName ?? '').toLowerCase().includes(q) ||
      (p.dsp ?? '').toLowerCase().includes(q)
    )
  }, [data, search])

  const totals = useMemo(() => aggregateTotals(filtered), [filtered])

  const topPortalId = useMemo(() => {
    if (!filtered.length) return null
    return filtered.reduce((top, p) => (p.totalRevenue ?? 0) > (top.totalRevenue ?? 0) ? p : top).portalId
  }, [filtered])



  return (
    <div className="min-h-screen">
      {/* Navbar */}
      <header className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 px-6 py-4 flex items-center justify-between sticky top-0 z-10 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center text-white font-bold text-sm">M</div>
          <div>
            <h1 className="font-bold text-gray-900 dark:text-white text-lg leading-tight">MIS Dashboard</h1>
            <p className="text-xs text-gray-400">Renewal Customer Analytics</p>
          </div>
        </div>
        {lastUpdated && (
          <div className="flex items-center gap-3">
            <span className="text-xs text-gray-400 hidden sm:block">
              Last updated: {format(lastUpdated, 'HH:mm:ss')}
            </span>
            <button
              onClick={onLogout}
              className="text-xs px-3 py-1.5 bg-red-50 dark:bg-red-900/20 hover:bg-red-100 dark:hover:bg-red-900/40 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-800 rounded-lg font-medium transition-colors"
            >
              🚪 Logout
            </button>
          </div>
        )}
      </header>

      <main className="max-w-screen-2xl mx-auto px-4 sm:px-6 py-6">
        <Filters
          date={date} setDate={setDate}
          search={search} setSearch={setSearch}
          onRefresh={load}
          darkMode={darkMode} setDarkMode={setDarkMode}
        />

        {loading && (
          <div className="flex flex-col items-center justify-center py-24 gap-4">
            <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
            <p className="text-gray-400 text-sm">Fetching data...</p>
          </div>
        )}

        {error && !loading && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-2xl p-6 text-center">
            <p className="text-red-600 dark:text-red-400 font-medium">⚠️ {error}</p>
            <button onClick={load} className="mt-3 px-4 py-2 bg-red-600 text-white rounded-lg text-sm hover:bg-red-700">
              Retry
            </button>
          </div>
        )}

        {!loading && !error && (
          <>
            <SummaryCards totals={totals} />
            <Charts portals={filtered} totals={totals} />

            <div className="flex items-center justify-between mb-4">
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Showing <span className="font-semibold text-gray-700 dark:text-gray-200">{filtered.length}</span> portals
              </p>
            </div>

            <PortalTable portals={filtered} topPortalId={topPortalId} />

            {filtered.length === 0 && (
              <div className="text-center py-16 text-gray-400">
                <p className="text-4xl mb-3">📭</p>
                <p>No data found. Try adjusting your filters.</p>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  )
}
