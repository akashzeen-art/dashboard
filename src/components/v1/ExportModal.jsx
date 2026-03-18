import { useState } from 'react'
import Modal from './Modal'
import { fmtDateDisplay, buildCSVRows, downloadCSV, groupByDateAndCampaign, escapeCSV, buildHourlyArrays } from '../../services/v1api'

const HOURS = Array.from({ length: 24 }, (_, i) =>
  `${String(i).padStart(2, '0')}:00-${String(i + 1).padStart(2, '0')}:00`
)

function buildCSVContent(campaigns, dateLabel) {
  const header = `DSP Name,Campaign ID,Links,Metric,Total,${HOURS.join(',')}`
  const rows = campaigns.map(c => buildCSVRows(c)).join('\n')
  return dateLabel ? `Date: ${dateLabel}\n${header}\n${rows}` : `${header}\n${rows}`
}

export default function ExportModal({ rawData, allCampaigns, selectedDSP, onClose }) {
  const dates = [...new Set(rawData.map(d => d.date).filter(Boolean))].sort()
  const [checked, setChecked] = useState(() => Object.fromEntries(dates.map(d => [d, true])))

  const toggle = d => setChecked(p => ({ ...p, [d]: !p[d] }))
  const setAll = v => setChecked(Object.fromEntries(dates.map(d => [d, v])))

  const handleExport = () => {
    const selected = dates.filter(d => checked[d])
    if (!selected.length) { alert('Please select at least one date.'); return }

    const grouped = groupByDateAndCampaign(rawData)
    selected.forEach(date => {
      const dm = grouped.get(date)
      if (!dm) return
      let campaigns = Array.from(dm.values())
      if (selectedDSP && selectedDSP !== 'all') campaigns = campaigns.filter(c => c.dspName === selectedDSP)
      if (!campaigns.length) return
      downloadCSV(buildCSVContent(campaigns, date), `v1mobi_${date}.csv`)
    })
    if (selected.length > 1) alert(`Exported ${selected.length} CSV files.`)
    onClose()
  }

  return (
    <Modal
      title="Select Dates to Export"
      onClose={onClose}
      footer={
        <>
          <button onClick={onClose} className="px-5 py-2 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-600 font-semibold text-sm">Cancel</button>
          <button onClick={handleExport} className="px-5 py-2 rounded-lg bg-green-500 hover:bg-green-600 text-white font-semibold text-sm">Export Selected</button>
        </>
      }
    >
      <div className="flex gap-2 mb-4 pb-4 border-b border-gray-100">
        <button onClick={() => setAll(true)} className="px-3 py-1.5 text-xs font-semibold bg-gray-100 hover:bg-[#667eea] hover:text-white rounded-lg transition-colors">Select All</button>
        <button onClick={() => setAll(false)} className="px-3 py-1.5 text-xs font-semibold bg-gray-100 hover:bg-[#667eea] hover:text-white rounded-lg transition-colors">Deselect All</button>
      </div>
      <div className="flex flex-col gap-2">
        {dates.length === 0 && <p className="text-gray-400 text-sm">No dates found in data.</p>}
        {dates.map(d => (
          <label key={d} className="flex items-center gap-3 p-3 bg-gray-50 hover:bg-gray-100 rounded-xl cursor-pointer transition-colors">
            <input type="checkbox" checked={!!checked[d]} onChange={() => toggle(d)}
              className="w-4 h-4 accent-[#667eea] cursor-pointer" />
            <span className="text-sm font-medium text-gray-700">{fmtDateDisplay(d)}</span>
          </label>
        ))}
      </div>
    </Modal>
  )
}
