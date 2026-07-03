import { ChevronLeft, ChevronRight } from 'lucide-react'

export default function Pagination({ currentPage, totalPages, onPageChange }) {
  if (totalPages <= 1) return null

  const pages = []
  for (let i = 0; i < totalPages; i++) {
    pages.push(i)
  }

  return (
    <div className="flex items-center justify-between px-6 py-3 border-t border-slate-100 dark:border-slate-800/60 bg-slate-50/50 dark:bg-slate-800/20">
      <button
        disabled={currentPage === 0}
        onClick={() => onPageChange(currentPage - 1)}
        className="flex items-center gap-1 px-3 py-1.5 text-sm font-semibold text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800 rounded-lg transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
      >
        <ChevronLeft className="w-4 h-4" /> Anterior
      </button>
      <div className="flex gap-1">
        {pages.map(i => (
          <button
            key={i}
            onClick={() => onPageChange(i)}
            className={`w-8 h-8 text-xs font-semibold rounded-lg transition-colors ${
              i === currentPage
                ? 'bg-blue-600 text-white'
                : 'text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            {i + 1}
          </button>
        ))}
      </div>
      <button
        disabled={currentPage >= totalPages - 1}
        onClick={() => onPageChange(currentPage + 1)}
        className="flex items-center gap-1 px-3 py-1.5 text-sm font-semibold text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800 rounded-lg transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
      >
        Siguiente <ChevronRight className="w-4 h-4" />
      </button>
    </div>
  )
}
