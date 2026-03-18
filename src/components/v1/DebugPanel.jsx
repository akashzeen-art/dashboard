import { useState } from 'react'
import { fetchV1Data } from '../../services/v1api'

export default function DebugPanel({ startDate, endDate }) {
  const [open, setOpen] = useState(false)
  const [output, setOutput] = useState('')
  const [loading, setLoading] = useState(false)

  const test = async () => {
    if (!startDate || !endDate) { setOutput('Please select dates first.'); return }
    setLoading(true)
    setOutput(`Testing API...\nURL: https://postback.v1mobi.com/postbacks/hourlyReport\nMethod: POST\nBody: ${JSON.stringify({ startDate, endDate }, null, 2)}\n\n`)
    try {
      const data = await fetchV1Data(startDate, endDate)
      setOutput(prev => prev +
        `=== RESPONSE ===\nType: ${typeof data}\nIs Array: ${Array.isArray(data)}\nKeys: ${Object.keys(data ?? {}).join(', ')}\n\n=== FULL JSON ===\n${JSON.stringify(data, null, 2)}`
      )
    } catch (e) {
      setOutput(prev => prev + `Error: ${e.message}\n${e.stack}`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 mb-6 overflow-hidden">
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center gap-2 px-5 py-3 bg-gray-50 hover:bg-gray-100 text-left font-semibold text-gray-600 text-sm transition-colors"
      >
        <span className={`transition-transform ${open ? 'rotate-90' : ''}`}>▶</span>
        🔍 Debug: View API Response
      </button>
      {open && (
        <div className="p-5 border-t border-gray-100">
          <button
            onClick={test}
            disabled={loading}
            className="mb-4 px-4 py-2 bg-gradient-to-r from-[#667eea] to-[#764ba2] text-white text-sm font-semibold rounded-lg hover:opacity-90 disabled:opacity-60 transition-opacity"
          >
            {loading ? 'Testing...' : 'Test API Connection'}
          </button>
          {output && (
            <pre className="bg-gray-50 border border-gray-200 rounded-xl p-4 text-xs font-mono text-gray-700 max-h-96 overflow-auto whitespace-pre-wrap break-words">
              {output}
            </pre>
          )}
        </div>
      )}
    </div>
  )
}
