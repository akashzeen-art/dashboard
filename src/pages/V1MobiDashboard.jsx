import { useState, useEffect, useCallback, useMemo } from 'react'
import {
  fetchV1Data, groupByDateAndCampaign, fmtDateDisplay,
  getToday, getYesterday, getDateBefore, fmtDate,
  buildCSVRows, downloadCSV
} from '../services/v1api'
import CampaignTable from '../components/v1/CampaignTable'
import ExportModal from '../components/v1/ExportModal'
import DebugPanel from '../components/v1/DebugPanel'

const HOURS = Array.from({ length: 24 }, (_, i) =>
  `${String(i).padStart(2, '0')}:00-${String(i + 1).padStart(2, '0')}:00`
)

// ── Quick filter button ────────────────────────────────────────────────────
function QBtn({ active, onClick, children }) {
  return (
    <button onClick={onClick}
      className={`px-5 py-2 rounded-xl text-sm font-semibold border-2 transition-all ${
        active
          ? 'bg-[#667eea] text-white border-[#667eea]'
          : 'bg-gray-100 text-gray-600 border-gray-200 hover:bg-[#667eea] hover:text-white hover:border-[#667eea]'
      }`}>
      {children}
    </button>
  )
}

// ── Main Dashboard ─────────────────────────────────────────────────────────
function V1Dashboard() {
  const [startDate, setStartDate] = useState(getToday())
  const [endDate, setEndDate]     = useState(getToday())
  const [activeFilter, setActiveFilter] = useState('today')
  const [rawData, setRawData]     = useState([])
  const [loading, setLoading]     = useState(false)
  const [error, setError]         = useState('')
  const [selectedDSP, setSelectedDSP] = useState('all')
  const [showExport, setShowExport]   = useState(false)

  const fetchData = useCallback(async (s, e) => {
    if (!s || !e) { setError('Please select both dates.'); return }
    if (new Date(s) > new Date(e)) { setError('Start date cannot be after end date.'); return }
    setLoading(true); setError('')
    try {
      const data = await fetchV1Data(s, e)
      setRawData(Array.isArray(data) ? data : data ? [data] : [])
      setSelectedDSP('all')
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [])

  // Load today on mount
  useEffect(() => { fetchData(getToday(), getToday()) }, [fetchData])

  const applyQuick = (key) => {
    setActiveFilter(key)
    let s, e
    if (key === 'today')     { s = e = getToday() }
    else if (key === 'yesterday') { s = e = getYesterday() }
    else if (key === '7days')     { s = getDateBefore(7); e = getToday() }
    else if (key === '1month')    { s = getDateBefore(30); e = getToday() }
    setStartDate(s); setEndDate(e)
    fetchData(s, e)
  }

  const handleView = () => { setActiveFilter(''); fetchData(startDate, endDate) }

  // Group data
  const dateGrouped = useMemo(() => groupByDateAndCampaign(rawData), [rawData])

  // Unique DSPs
  const dsps = useMemo(() => {
    const set = new Set()
    dateGrouped.forEach(dm => dm.forEach(c => { if (c.dspName && c.dspName !== '-') set.add(c.dspName) }))
    return [...set]
  }, [dateGrouped])

  // Filtered + sorted dates
  const sortedDates = useMemo(() => [...dateGrouped.keys()].sort(), [dateGrouped])

  const filteredDates = useMemo(() =>
    sortedDates.map(date => {
      let campaigns = [...dateGrouped.get(date).values()]
      if (selectedDSP !== 'all') campaigns = campaigns.filter(c => c.dspName === selectedDSP)
      return { date, campaigns }
    }).filter(d => d.campaigns.length > 0),
  [sortedDates, dateGrouped, selectedDSP])

  // Export all
  const exportAll = () => {
    const header = `DSP Name,Campaign ID,Links,Metric,Total,${HOURS.join(',')}`
    let rows = ''
    filteredDates.forEach(({ campaigns }) => {
      campaigns.forEach(c => { rows += buildCSVRows(c) + '\n' })
    })
    downloadCSV(`${header}\n${rows}`, `v1mobi_all_${fmtDate(new Date())}.csv`)
  }

  const hasData = rawData.length > 0

  return (
    <div className="min-h-screen bg-[#f5f7fa]">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200 px-6 py-4 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-[#667eea]">📊 V1 Mobi Dashboard</h1>

      </header>

      <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 py-6">

        {/* Filters */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 mb-6">
          {/* Date row */}
          <div className="flex flex-wrap gap-4 items-end mb-5">
            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1.5">Start Date</label>
              <input type="date" value={startDate}
                onChange={e => { setStartDate(e.target.value); setActiveFilter('') }}
                className="border-2 border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-[#667eea] transition-colors" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1.5">End Date</label>
              <input type="date" value={endDate}
                onChange={e => { setEndDate(e.target.value); setActiveFilter('') }}
                className="border-2 border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-[#667eea] transition-colors" />
            </div>
            <button onClick={handleView}
              className="px-6 py-2 bg-gradient-to-r from-[#667eea] to-[#764ba2] text-white text-sm font-semibold rounded-xl hover:opacity-90 transition-opacity">
              View
            </button>
          </div>

          {/* Quick filters */}
          <div className="flex flex-wrap gap-3 mb-5">
            <QBtn active={activeFilter === 'today'}     onClick={() => applyQuick('today')}>Today</QBtn>
            <QBtn active={activeFilter === 'yesterday'} onClick={() => applyQuick('yesterday')}>Yesterday</QBtn>
            <QBtn active={activeFilter === '7days'}     onClick={() => applyQuick('7days')}>Last 7 Days</QBtn>
            <QBtn active={activeFilter === '1month'}    onClick={() => applyQuick('1month')}>Last 1 Month</QBtn>
          </div>

          {/* DSP filters */}
          {dsps.length > 0 && (
            <div className="pt-5 border-t border-gray-100">
              <p className="text-xs font-semibold text-gray-500 mb-3">Filter by DSP:</p>
              <div className="flex flex-wrap gap-2">
                <QBtn active={selectedDSP === 'all'} onClick={() => setSelectedDSP('all')}>All</QBtn>
                {dsps.map(d => (
                  <QBtn key={d} active={selectedDSP === d} onClick={() => setSelectedDSP(d)}>{d}</QBtn>
                ))}
              </div>
            </div>
          )}

          {/* Export */}
          {hasData && (
            <div className="pt-5 border-t border-gray-100 mt-5">
              <p className="text-xs font-semibold text-gray-500 mb-3">Export Data:</p>
              <div className="flex flex-wrap gap-3">
                <button onClick={exportAll}
                  className="px-5 py-2 bg-green-500 hover:bg-green-600 text-white text-sm font-semibold rounded-xl transition-colors">
                  📥 Export All CSV
                </button>
                <button onClick={() => setShowExport(true)}
                  className="px-5 py-2 bg-green-500 hover:bg-green-600 text-white text-sm font-semibold rounded-xl transition-colors">
                  📅 Export Date-Wise CSV
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Debug */}
        <DebugPanel startDate={startDate} endDate={endDate} />

        {/* Loading */}
        {loading && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-12 flex flex-col items-center gap-4 mb-6">
            <div className="w-12 h-12 border-4 border-[#667eea] border-t-transparent rounded-full animate-spin" />
            <p className="text-gray-500 text-sm">Loading data...</p>
          </div>
        )}

        {/* Error */}
        {error && !loading && (
          <div className="bg-red-50 border border-red-200 rounded-2xl p-5 mb-6 flex items-center gap-3">
            <span className="text-red-500 text-xl">⚠️</span>
            <p className="text-red-600 text-sm font-medium">{error}</p>
          </div>
        )}

        {/* Tables */}
        {!loading && !error && (
          <>
            {filteredDates.length === 0 && hasData && (
              <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-12 text-center text-gray-400">
                No campaign data for selected DSP.
              </div>
            )}
            {filteredDates.length === 0 && !hasData && (
              <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-12 text-center text-gray-400">
                <p className="text-4xl mb-3">📭</p>
                <p>No data yet. Select a date range and click View.</p>
              </div>
            )}

            {filteredDates.map(({ date, campaigns }) => (
              <div key={date} className="mb-8">
                {/* Date header */}
                <div className="bg-gradient-to-r from-[#667eea] to-[#764ba2] px-6 py-4 rounded-t-2xl">
                  <h2 className="text-white font-semibold text-lg">📅 {fmtDateDisplay(date)}</h2>
                </div>
                {/* Campaign tables */}
                {campaigns.map((campaign, i) => (
                  <CampaignTable
                    key={`${campaign.dspName}_${campaign.campaignId}_${i}`}
                    campaign={campaign}
                    startDate={startDate}
                    endDate={endDate}
                  />
                ))}
              </div>
            ))}
          </>
        )}
      </div>

      {/* Export modal */}
      {showExport && (
        <ExportModal
          rawData={rawData}
          allCampaigns={filteredDates.flatMap(d => d.campaigns)}
          selectedDSP={selectedDSP}
          onClose={() => setShowExport(false)}
        />
      )}
    </div>
  )
}

export default function V1MobiDashboard() {
  return <V1Dashboard />
}
