const API_URL = 'https://postback.v1mobi.com/postbacks/hourlyReport'
const CUT_API = 'https://postback.v1mobi.com/optimize'

export const V1_CREDENTIALS = { email: 'admin@gmail.com', password: 'Admin@123' }

export function fmtDate(date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
}

export function fmtDateDisplay(str) {
  if (!str) return str
  try {
    return new Date(str + 'T00:00:00').toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
  } catch { return str }
}

export function getToday() { return fmtDate(new Date()) }
export function getYesterday() { const d = new Date(); d.setDate(d.getDate() - 1); return fmtDate(d) }
export function getDateBefore(days) { const d = new Date(); d.setDate(d.getDate() - (days - 1)); return fmtDate(d) }
export function isToday(start, end) { const t = getToday(); return start === t && end === t }

export async function fetchV1Data(startDate, endDate) {
  const res = await fetch(API_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify({ startDate, endDate }),
    mode: 'cors',
  })
  if (!res.ok) throw new Error(`API Error: ${res.status} ${res.statusText}`)
  const text = await res.text()
  try { return JSON.parse(text) } catch { throw new Error('Invalid JSON: ' + text.slice(0, 200)) }
}

export async function updateCut(campaignId, links, cutValue) {
  let id = campaignId
  if (links?.includes('id=')) { const m = links.match(/[?&]id=(\d+)/); if (m) id = m[1] }
  const res = await fetch(`${CUT_API}?id=${id}&cut=${cutValue}`, { method: 'GET', mode: 'cors' })
  if (!res.ok) throw new Error(`API Error: ${res.status}`)
  const text = await res.text()
  return text
}

export function parseHourlyItem(item) {
  let hour = -1
  if (item.hour != null) {
    const m = String(item.hour).trim().match(/^(\d{1,2})/)
    if (m) hour = parseInt(m[1], 10)
  }
  const get = (obj, ...keys) => { for (const k of keys) { if (obj[k] != null) return parseInt(obj[k], 10) || 0 } return 0 }
  return {
    hour,
    clicks: get(item, 'clicks', 'click', 'Clicks'),
    conversions: get(item, 'conversions', 'conversion', 'Conversions'),
    stp: get(item, 'stp', 'STP'),
  }
}

export function buildHourlyArrays(hourlyData) {
  const clicks = new Array(24).fill(0)
  const conversions = new Array(24).fill(0)
  const stp = new Array(24).fill(0)
  ;(hourlyData ?? []).forEach(item => {
    const { hour, clicks: c, conversions: cv, stp: s } = parseHourlyItem(item)
    if (hour >= 0 && hour < 24) {
      clicks[hour] += c
      conversions[hour] += cv
      stp[hour] += s
    }
  })
  return { clicks, conversions, stp }
}

export function groupByDateAndCampaign(data) {
  const arr = Array.isArray(data) ? data : (data ? [data] : [])
  const map = new Map()
  arr.forEach(item => {
    const date = item.date || 'unknown'
    const key = `${item.dspName || ''}_${item.campaignId || ''}_${item.links || ''}`
    if (!map.has(date)) map.set(date, new Map())
    const dm = map.get(date)
    if (!dm.has(key)) {
      dm.set(key, {
        dspName: item.dspName || '-',
        campaignId: item.campaignId || '-',
        links: item.links || '-',
        productname: item.productname || '-',
        date,
        cut: item.cut ?? 0,
        hourlyData: [],
      })
    }
    if (Array.isArray(item.hourlyData)) dm.get(key).hourlyData.push(...item.hourlyData)
  })
  return map
}

export function escapeCSV(v) {
  if (v == null) return ''
  const s = String(v)
  return s.includes(',') || s.includes('"') || s.includes('\n') ? `"${s.replace(/"/g, '""')}"` : s
}

export function buildCSVRows(campaign) {
  const { clicks, conversions, stp } = buildHourlyArrays(campaign.hourlyData)
  const tc = clicks.reduce((a, b) => a + b, 0)
  const tv = conversions.reduce((a, b) => a + b, 0)
  const ts = stp.reduce((a, b) => a + b, 0)
  const cr = (a, b) => b > 0 ? ((a / b) * 100).toFixed(2) : '0.00'
  const d = escapeCSV(campaign.dspName), ci = escapeCSV(campaign.campaignId), l = escapeCSV(campaign.links)
  const hourCols = (arr) => arr.map(v => v).join(',')
  return [
    `${d},${ci},${l},Clicks,${tc},${hourCols(clicks)}`,
    `${d},${ci},${l},Conversion,${tv},${hourCols(conversions)}`,
    `${d},${ci},${l},STP,${ts},${hourCols(stp)}`,
    `${d},${ci},${l},Normal CR,${cr(tv, tc)},${clicks.map((c, i) => cr(conversions[i], c)).join(',')}`,
    `${d},${ci},${l},STP CR,${cr(ts, tc)},${clicks.map((c, i) => cr(stp[i], c)).join(',')}`,
  ].join('\n')
}

export function downloadCSV(content, filename) {
  const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' })
  const a = document.createElement('a')
  a.href = URL.createObjectURL(blob)
  a.download = filename
  a.style.visibility = 'hidden'
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
}
