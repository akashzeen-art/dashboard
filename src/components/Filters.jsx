import { format } from 'date-fns'

export default function Filters({ date, setDate, search, setSearch, onRefresh, darkMode, setDarkMode }) {
  const today = format(new Date(), 'yyyy-MM-dd')

  return (
    <div className="flex flex-wrap gap-3 items-center mb-6 p-4 bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800">
      {/* Date Picker */}
      <div className="flex items-center gap-2">
        <span className="text-sm text-gray-500 dark:text-gray-400">📅</span>
        <input
          type="date"
          value={date || today}
          max={today}
          onChange={e => setDate(e.target.value)}
          className="text-sm border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 bg-gray-50 dark:bg-gray-800 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>


      {/* Search */}
      <input
        type="text"
        placeholder="🔍 Search portal, PG, DSP..."
        value={search}
        onChange={e => setSearch(e.target.value)}
        className="flex-1 min-w-[200px] text-sm border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 bg-gray-50 dark:bg-gray-800 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
      />

      <div className="flex gap-2 ml-auto">
        {/* Refresh */}
        <button
          onClick={onRefresh}
          className="px-4 py-2 text-sm bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
        >
          🔄 Refresh
        </button>

        {/* Dark Mode */}
        <button
          onClick={() => setDarkMode(d => !d)}
          className="px-3 py-2 text-sm border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
          title="Toggle dark mode"
        >
          {darkMode ? '☀️' : '🌙'}
        </button>
      </div>
    </div>
  )
}
