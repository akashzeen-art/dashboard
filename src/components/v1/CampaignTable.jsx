import { useState } from 'react'
import { buildHourlyArrays, updateCut, isToday } from '../../services/v1api'
import Modal from './Modal'

const HOURS = Array.from({ length: 24 }, (_, i) =>
  `${String(i).padStart(2, '0')}:00-${String(i + 1).padStart(2, '0')}:00`
)

const cr = (a, b) => (b > 0 ? ((a / b) * 100).toFixed(2) + '%' : '0.00%')

const ROW_STYLES = {
  Clicks:      'bg-white',
  Conversion:  'bg-white',
  STP:         'bg-white',
  'Normal CR': 'bg-indigo-50',
  'STP CR':    'bg-indigo-50',
}

const TOTAL_COLORS = {
  Clicks:      'text-gray-800',
  Conversion:  'text-green-600',
  STP:         'text-orange-500',
  'Normal CR': 'text-indigo-600',
  'STP CR':    'text-indigo-600',
}

export default function CampaignTable({ campaign, startDate, endDate }) {
  const [cutVal, setCutVal] = useState(String(campaign.cut ?? 0))
  const [pendingCut, setPendingCut] = useState(null)
  const [cutLoading, setCutLoading] = useState(false)
  const [cutMsg, setCutMsg] = useState(null)

  const showCut = isToday(startDate, endDate)
  const { clicks, conversions, stp } = buildHourlyArrays(campaign.hourlyData)
  const tc = clicks.reduce((a, b) => a + b, 0)
  const tv = conversions.reduce((a, b) => a + b, 0)
  const ts = stp.reduce((a, b) => a + b, 0)

  const rows = [
    { label: 'Clicks',     values: clicks,      total: tc },
    { label: 'Conversion', values: conversions,  total: tv },
    { label: 'STP',        values: stp,          total: ts },
    {
      label: 'Normal CR',
      values: clicks.map((c, i) => cr(conversions[i], c)),
      total: cr(tv, tc),
    },
    {
      label: 'STP CR',
      values: clicks.map((c, i) => cr(stp[i], c)),
      total: cr(ts, tc),
    },
  ]

  const handleCutChange = (val) => {
    setPendingCut({ old: cutVal, new: val })
  }

  const confirmCut = async () => {
    setCutLoading(true)
    try {
      await updateCut(campaign.campaignId, campaign.links, pendingCut.new)
      setCutVal(pendingCut.new)
      setCutMsg({ type: 'success', text: 'CUT updated successfully!' })
    } catch {
      setCutMsg({ type: 'error', text: 'Failed to update CUT. Please try again.' })
    } finally {
      setCutLoading(false)
      setPendingCut(null)
      setTimeout(() => setCutMsg(null), 3000)
    }
  }

  const linkUrl = campaign.links !== '-' ? campaign.links : null

  return (
    <div className="bg-white rounded-b-xl shadow-sm border border-t-0 border-gray-200 mb-1">
      {/* Meta row */}
      <div className="flex flex-wrap gap-x-8 gap-y-2 px-5 py-4 border-b border-gray-100 bg-gray-50/60">
        <div className="text-sm">
          <span className="font-semibold text-gray-500">DSP:</span>{' '}
          <span className="font-bold text-[#667eea]">{campaign.dspName}</span>
        </div>
        <div className="text-sm">
          <span className="font-semibold text-gray-500">Campaign ID:</span>{' '}
          <span className="font-bold text-gray-800">{campaign.campaignId}</span>
        </div>
        <div className="text-sm">
          <span className="font-semibold text-gray-500">Link:</span>{' '}
          {linkUrl ? (
            <a href={linkUrl} target="_blank" rel="noopener noreferrer"
              className="text-[#667eea] hover:text-[#764ba2] hover:underline font-medium break-all">
              {linkUrl}
            </a>
          ) : (
            <span className="text-gray-600">{campaign.links}</span>
          )}
        </div>
        {showCut && (
          <div className="text-sm flex items-center gap-2">
            <span className="font-semibold text-gray-500">CUT:</span>
            <select
              value={cutVal}
              onChange={e => handleCutChange(e.target.value)}
              className="border-2 border-gray-200 rounded-lg px-2 py-1 text-sm font-semibold text-gray-700 focus:outline-none focus:border-[#667eea] cursor-pointer"
            >
              {['0', '10', '20', '30'].map(v => <option key={v} value={v}>{v}</option>)}
            </select>
            {cutMsg && (
              <span className={`text-xs font-medium ${cutMsg.type === 'success' ? 'text-green-600' : 'text-red-500'}`}>
                {cutMsg.text}
              </span>
            )}
          </div>
        )}
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="border-collapse text-xs" style={{ minWidth: '1400px', width: '100%' }}>
          <thead>
            <tr className="bg-gradient-to-r from-[#667eea] to-[#764ba2] text-white">
              <th className="sticky left-0 z-20 bg-[#667eea] px-4 py-3 text-left font-semibold whitespace-nowrap min-w-[110px]">Metric</th>
              <th className="sticky left-[110px] z-20 bg-[#667eea] px-4 py-3 text-center font-semibold whitespace-nowrap min-w-[80px] border-l-2 border-white/30">Total</th>
              {HOURS.map(h => (
                <th key={h} className="px-3 py-3 text-center font-semibold whitespace-nowrap border-l border-white/20">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, ri) => (
              <tr key={row.label} className={`${ROW_STYLES[row.label]} hover:bg-blue-50/40 transition-colors`}>
                <td className={`sticky left-0 z-10 px-4 py-2.5 font-semibold text-gray-700 whitespace-nowrap border-b border-gray-100 ${ROW_STYLES[row.label]}`}>
                  {row.label}
                </td>
                <td className={`sticky left-[110px] z-10 px-4 py-2.5 text-center font-bold border-l-2 border-gray-200 border-b border-gray-100 ${TOTAL_COLORS[row.label]} ${ROW_STYLES[row.label]}`}>
                  {row.total}
                </td>
                {row.values.map((v, i) => (
                  <td key={i} className="px-3 py-2.5 text-center border-l border-gray-100 border-b border-gray-100 text-gray-700">
                    {v}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* CUT confirm modal */}
      {pendingCut && (
        <Modal
          title="Confirm CUT Change"
          onClose={() => { setPendingCut(null); }}
          footer={
            <>
              <button onClick={() => setPendingCut(null)}
                className="px-5 py-2 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-600 font-semibold text-sm transition-colors">
                Cancel
              </button>
              <button onClick={confirmCut} disabled={cutLoading}
                className="px-5 py-2 rounded-lg bg-green-500 hover:bg-green-600 disabled:opacity-60 text-white font-semibold text-sm transition-colors">
                {cutLoading ? 'Updating...' : 'Confirm'}
              </button>
            </>
          }
        >
          <p className="text-gray-700 text-base leading-relaxed">
            Are you sure you want to change CUT from{' '}
            <span className="font-bold text-[#667eea]">{pendingCut.old}</span> to{' '}
            <span className="font-bold text-green-600">{pendingCut.new}</span> for Campaign ID:{' '}
            <span className="font-bold text-gray-900">{campaign.campaignId}</span>?
          </p>
        </Modal>
      )}
    </div>
  )
}
