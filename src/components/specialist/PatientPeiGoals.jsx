import { useState, useMemo } from 'react'
import { Target, Plus, Search, X } from 'lucide-react'

export default function PatientPeiGoals({ peiGoals, incrementPeiTrial }) {
  const [searchGoal, setSearchGoal] = useState('')
  const [filterCategory, setFilterCategory] = useState('TODAS')

  const categoriasUnicas = useMemo(() => {
    return [...new Set(peiGoals.map(g => g.category).filter(Boolean))]
  }, [peiGoals])

  const goalsFiltrados = useMemo(() => {
    return peiGoals.filter(goal => {
      const q = searchGoal.toLowerCase()
      if (searchGoal && !goal.goal?.toLowerCase().includes(q)) return false
      if (filterCategory !== 'TODAS' && goal.category !== filterCategory) return false
      return true
    })
  }, [peiGoals, searchGoal, filterCategory])

  const hasFilters = searchGoal || filterCategory !== 'TODAS'

  return (
    <div className="bg-white dark:bg-[#1E293B] rounded-xl p-6 shadow-sm border border-slate-200 dark:border-slate-800/60 transition-all duration-200">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
          <Target className="w-5 h-5 text-indigo-500" />
          Metas PEI (Trial-by-trial)
        </h2>
        <span className="text-xs font-semibold px-2 py-1 bg-indigo-50 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400 rounded-md">
          Sesión Actual
        </span>
      </div>

      {/* Filtros */}
      <div className="flex flex-wrap gap-2 mb-4">
        <div className="relative flex-1 min-w-[160px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
          <input type="text" placeholder="Buscar meta..." value={searchGoal} onChange={e => setSearchGoal(e.target.value)} className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-lg outline-none focus:ring-2 focus:ring-blue-500" />
        </div>
        {categoriasUnicas.length > 0 && (
          <select value={filterCategory} onChange={e => setFilterCategory(e.target.value)} className="px-2 py-1.5 text-xs bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer">
            <option value="TODAS">Todas las categorías</option>
            {categoriasUnicas.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        )}
        {hasFilters && (
          <button onClick={() => { setSearchGoal(''); setFilterCategory('TODAS') }} className="flex items-center gap-1 px-2 py-1.5 text-xs font-semibold text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors shrink-0">
            <X className="w-3 h-3" /> Limpiar
          </button>
        )}
      </div>

      {goalsFiltrados.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-10 text-slate-400 dark:text-slate-500">
          <Target className="w-8 h-8 mb-2 opacity-50" />
          <p className="text-sm">{hasFilters ? 'No hay metas que coincidan con los filtros.' : 'No hay metas PEI registradas.'}</p>
        </div>
      ) : (
        <div className="space-y-4">
          {goalsFiltrados.map(goal => (
            <div key={goal.id} className="p-4 rounded-xl border border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/40">
              <div className="flex justify-between items-start mb-2">
                <div>
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">{goal.category}</span>
                  <p className="text-sm font-semibold text-slate-900 dark:text-white">{goal.goal}</p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-xs font-mono font-bold text-slate-600 dark:text-slate-300 bg-white dark:bg-slate-900 px-2 py-1 rounded shadow-sm border border-slate-200 dark:border-slate-700">
                    {goal.trials} / {goal.totalTrials}
                  </span>
                  <button 
                    onClick={() => incrementPeiTrial(goal.id)}
                    disabled={goal.trials >= goal.totalTrials}
                    className="p-1.5 bg-indigo-100 hover:bg-indigo-200 text-indigo-600 dark:bg-indigo-900/50 dark:hover:bg-indigo-800 dark:text-indigo-300 rounded-md disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
              </div>
              {/* Progress bar */}
              <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2 mt-3">
                <div 
                  className={`h-2 rounded-full transition-all duration-500 ${goal.progress === 100 ? 'bg-emerald-500' : 'bg-indigo-500'}`} 
                  style={{ width: `${goal.progress}%` }}
                ></div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
