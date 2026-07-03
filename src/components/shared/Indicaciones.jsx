import { useState, useEffect, useMemo } from 'react'
import { useGlobalContext } from '../../context/GlobalState'
import Pagination from './Pagination'

export default function Indicaciones() {
  const { reports, navigate } = useGlobalContext()
  const [isDark, setIsDark] = useState(false)
  const PAGE_SIZE = 8
  const [page, setPage] = useState(0)
  const totalPages = Math.ceil(reports.length / PAGE_SIZE)
  const pagedReports = reports.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE)

  useEffect(() => {
    if (document.documentElement.classList.contains('dark')) {
      setIsDark(true)
    }
  }, [])

  const toggleTheme = () => {
    if (isDark) {
      document.documentElement.classList.remove('dark')
    } else {
      document.documentElement.classList.add('dark')
    }
    setIsDark(!isDark)
  }

  return (
    <div className="p-6 md:p-8 w-full">
      <div className="max-w-4xl mx-auto flex flex-col">
        <div className="pr-2 pb-10 space-y-4">
          {pagedReports.map((report, idx) => (
            <div key={idx} className="bg-white dark:bg-slate-800 rounded-xl p-5 shadow-sm border border-gray-100 dark:border-slate-700 transition-all hover:shadow-md group">
              <div className="flex gap-4">
                <div className="w-12 h-12 rounded-full bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                </div>
                <div className="flex-1">
                  <div className="flex justify-between items-center mb-1">
                    <h4 className="font-semibold text-gray-800 dark:text-gray-200">Especialista</h4>
                    <span className="text-xs font-medium text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-slate-700 px-2 py-1 rounded-md">
                      {new Date(report.fec_repo).toLocaleDateString('es-ES', { day: '2-digit', month: 'long', year: 'numeric' })}
                    </span>
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-300 bg-gray-50 dark:bg-slate-900/50 p-3 rounded-lg border border-gray-100 dark:border-slate-700 mt-3 whitespace-pre-line">
                    "{report.com_tend}"
                  </div>

                  {report.id_rutin && (
                    <div className="mt-4">
                      <button
                        onClick={() => navigate('rutinas')}
                        className="inline-flex items-center gap-2 text-sm font-semibold text-brand-500 hover:text-brand-600 transition-colors"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" /></svg>
                        [Ver Rutina asociada]
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
        <Pagination currentPage={page} totalPages={totalPages} onPageChange={setPage} />
      </div>
    </div>
  )
}
