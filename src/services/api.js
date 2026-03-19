const BASE_URL = 'https://ap.eatme.live/api/mis/hourly'

export async function fetchMISData(date) {
  const url = date ? `${BASE_URL}?date=${date}` : BASE_URL
  const res = await fetch(url)
  if (!res.ok) throw new Error(`API error: ${res.status} ${res.statusText}`)
  return res.json()
}

export function aggregateTotals(portals) {
  return portals.reduce(
    (acc, p) => {
      const hours = p.hours ?? []
      const successCount = hours.reduce((s, h) => s + (h.success ?? 0), 0)
      const renewCount = hours.reduce((s, h) => {
        const r = h.renew
        if (!r || typeof r !== 'object') return s
        return s + Object.values(r).reduce((a, v) => a + (v ?? 0), 0)
      }, 0)
      return {
        totalRevenue: acc.totalRevenue + (p.totalRevenue ?? 0),
        successRevenue: acc.successRevenue + (p.successRevenue ?? 0),
        renewRevenue: acc.renewRevenue + (p.renewRevenue ?? 0),
        successCount: acc.successCount + successCount,
        renewCount: acc.renewCount + renewCount,
      }
    },
    { totalRevenue: 0, successRevenue: 0, renewRevenue: 0, successCount: 0, renewCount: 0 }
  )
}

export function filterByTimeOfDay(hours, mode) {
  if (!hours) return []
  return hours.filter(({ hour }) => {
    const h = parseInt(hour, 10)
    return mode === 'day' ? h >= 6 && h < 18 : h >= 18 || h < 6
  })
}

export function totalRenew(renew) {
  if (!renew || typeof renew !== 'object') return 0
  return Object.values(renew).reduce((s, v) => s + (v ?? 0), 0)
}

export function exportToCSV(rows, filename) {
  if (!rows.length) return
  const headers = Object.keys(rows[0])
  const csv = [headers.join(','), ...rows.map(r => headers.map(h => JSON.stringify(r[h] ?? '')).join(','))].join('\n')
  const blob = new Blob([csv], { type: 'text/csv' })
  const a = document.createElement('a')
  a.href = URL.createObjectURL(blob)
  a.download = filename
  a.click()
}
