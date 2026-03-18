export default function Modal({ title, onClose, footer, children }) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-lg mx-4 overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-6 py-4 bg-gradient-to-r from-[#667eea] to-[#764ba2]">
          <h2 className="text-white font-semibold text-lg">{title}</h2>
          <button onClick={onClose} className="text-white text-2xl leading-none hover:scale-110 transition-transform">&times;</button>
        </div>
        <div className="px-6 py-5 max-h-96 overflow-y-auto">{children}</div>
        {footer && (
          <div className="px-6 py-4 bg-gray-50 flex justify-end gap-3 border-t border-gray-100">
            {footer}
          </div>
        )}
      </div>
    </div>
  )
}
