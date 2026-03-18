import { useState, useEffect } from 'react'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import V1MobiDashboard from './pages/V1MobiDashboard'

export default function App() {
  const [authed, setAuthed]     = useState(() => sessionStorage.getItem('mis_auth') === '1')
  const [darkMode, setDarkMode] = useState(() => localStorage.getItem('theme') === 'dark')
  const [activePage, setActivePage] = useState('mis') // 'mis' | 'v1mobi'

  useEffect(() => {
    document.documentElement.classList.toggle('dark', darkMode)
    localStorage.setItem('theme', darkMode ? 'dark' : 'light')
  }, [darkMode])

  const handleLogout = () => {
    sessionStorage.removeItem('mis_auth')
    setAuthed(false)
  }

  if (!authed) return <Login onLogin={() => setAuthed(true)} />

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      {/* Top nav — page switcher */}
      <nav className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 px-6 py-2 flex items-center gap-2 sticky top-0 z-20 shadow-sm">
        <button
          onClick={() => setActivePage('mis')}
          className={`px-4 py-1.5 rounded-lg text-sm font-semibold transition-colors ${
            activePage === 'mis'
              ? 'bg-blue-600 text-white'
              : 'text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'
          }`}
        >
          📊 MIS Dashboard
        </button>
        <button
          onClick={() => setActivePage('v1mobi')}
          className={`px-4 py-1.5 rounded-lg text-sm font-semibold transition-colors ${
            activePage === 'v1mobi'
              ? 'bg-[#667eea] text-white'
              : 'text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'
          }`}
        >
          📡 V1 Mobi Dashboard
        </button>
      </nav>

      {activePage === 'mis' && (
        <Dashboard darkMode={darkMode} setDarkMode={setDarkMode} onLogout={handleLogout} />
      )}
      {activePage === 'v1mobi' && (
        <V1MobiDashboard />
      )}
    </div>
  )
}
