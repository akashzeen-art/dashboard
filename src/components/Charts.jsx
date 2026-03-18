import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts'
import { totalRenew } from '../services/api'

const COLORS = ['#3b82f6', '#10b981', '#8b5cf6', '#f59e0b', '#ef4444', '#06b6d4']

function HourlyLineChart({ portals }) {
  const slots = Array.from({ length: 24 }, (_, h) => ({ hour: h, init: 0, success: 0, renew: 0 }))
  portals.forEach(portal => {
    ;(portal.hours ?? []).forEach(({ hour, init, success, renew }) => {
      slots[hour].init += init ?? 0
      slots[hour].success += success ?? 0
      slots[hour].renew += totalRenew(renew)
    })
  })
  const data = slots.map(s => ({ ...s, hour: String(s.hour).padStart(2, '0') + ':00' }))

  return (
    <div className="bg-white dark:bg-gray-900 rounded-2xl p-5 shadow-sm border border-gray-100 dark:border-gray-800">
      <h3 className="font-semibold text-gray-700 dark:text-gray-200 mb-4">📈 Hourly Trend (Init / Success / Renew)</h3>
      <ResponsiveContainer width="100%" height={260}>
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
          <XAxis dataKey="hour" tick={{ fontSize: 11 }} />
          <YAxis tick={{ fontSize: 11 }} />
          <Tooltip />
          <Legend />
          <Line type="monotone" dataKey="init" stroke="#3b82f6" strokeWidth={2} dot={false} />
          <Line type="monotone" dataKey="success" stroke="#10b981" strokeWidth={2} dot={false} />
          <Line type="monotone" dataKey="renew" stroke="#8b5cf6" strokeWidth={2} dot={false} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}

function RevenueBarChart({ portals }) {
  const data = portals.map(p => ({
    name: (p.portalName ?? `P${p.portalId}`).slice(0, 12),
    Total: +(p.totalRevenue ?? 0).toFixed(2),
    Success: +(p.successRevenue ?? 0).toFixed(2),
    Renew: +(p.renewRevenue ?? 0).toFixed(2),
  }))

  return (
    <div className="bg-white dark:bg-gray-900 rounded-2xl p-5 shadow-sm border border-gray-100 dark:border-gray-800">
      <h3 className="font-semibold text-gray-700 dark:text-gray-200 mb-4">📊 Revenue by Portal</h3>
      <ResponsiveContainer width="100%" height={260}>
        <BarChart data={data} barSize={18}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
          <XAxis dataKey="name" tick={{ fontSize: 10 }} />
          <YAxis tick={{ fontSize: 11 }} />
          <Tooltip formatter={v => '₹' + v.toLocaleString('en-IN')} />
          <Legend />
          <Bar dataKey="Total" fill="#3b82f6" radius={[4, 4, 0, 0]} />
          <Bar dataKey="Success" fill="#10b981" radius={[4, 4, 0, 0]} />
          <Bar dataKey="Renew" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}

function RevenuePieChart({ totals }) {
  const data = [
    { name: 'Success Revenue', value: +(totals.successRevenue ?? 0).toFixed(2) },
    { name: 'Renew Revenue', value: +(totals.renewRevenue ?? 0).toFixed(2) },
  ].filter(d => d.value > 0)

  if (!data.length) return null

  return (
    <div className="bg-white dark:bg-gray-900 rounded-2xl p-5 shadow-sm border border-gray-100 dark:border-gray-800">
      <h3 className="font-semibold text-gray-700 dark:text-gray-200 mb-4">🥧 Success vs Renew Revenue</h3>
      <ResponsiveContainer width="100%" height={260}>
        <PieChart>
          <Pie data={data} cx="50%" cy="50%" outerRadius={90} dataKey="value" label={({ name, percent }) => `${name.split(' ')[0]} ${(percent * 100).toFixed(1)}%`}>
            {data.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
          </Pie>
          <Tooltip formatter={v => '₹' + Number(v).toLocaleString('en-IN')} />
        </PieChart>
      </ResponsiveContainer>
    </div>
  )
}

export default function Charts({ portals, totals }) {
  if (!portals.length) return null
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4 mb-6">
      <div className="lg:col-span-2 xl:col-span-2">
        <HourlyLineChart portals={portals} />
      </div>
      <RevenuePieChart totals={totals} />
      <div className="lg:col-span-2 xl:col-span-3">
        <RevenueBarChart portals={portals} />
      </div>
    </div>
  )
}
