import { useState, useMemo, useEffect, useRef } from 'react'
import { Target, Plus, Search, X, Trophy } from 'lucide-react'

function AnimatedCounter({ value, duration = 600 }) {
  const [display, setDisplay] = useState(0)
  const prevRef = useRef(0)
  const rafRef = useRef(null)

  useEffect(() => {
    const startVal = prevRef.current
    const diff = value - startVal
    if (diff === 0) return
    const startTime = performance.now()
    const animate = (now) => {
      const elapsed = now - startTime
      const progress = Math.min(elapsed / duration, 1)
      const eased = 1 - Math.pow(1 - progress, 3)
      setDisplay(Math.round(startVal + diff * eased))
      if (progress < 1) rafRef.current = requestAnimationFrame(animate)
      else prevRef.current = value
    }
    rafRef.current = requestAnimationFrame(animate)
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current) }
  }, [value, duration])

  return <span>{display}</span>
}

function getProgressColor(pct) {
  if (pct >= 100) return 'bg-emerald-500'
  if (pct >= 70) return 'bg-emerald-400'
  if (pct >= 40) return 'bg-amber-400'
  return 'bg-rose-400'
}

function getProgressBg(pct) {
  if (pct >= 100) return 'bg-emerald-100 dark:bg-emerald-900/30'
  if (pct >= 70) return 'bg-emerald-50 dark:bg-emerald-950/20'
  if (pct >= 40) return 'bg-amber-50 dark:bg-amber-950/20'
  return 'bg-rose-50 dark:bg-rose-950/20'
}

function getStatusLabel(pct) {
  if (pct >= 100) return { text: 'Completada', color: 'text-emerald-600 dark:text-emerald-400' }
  if (pct >= 70) return { text: 'Avanzada', color: 'text-emerald-500 dark:text-emerald-400' }
  if (pct >= 40) return { text: 'En Progreso', color: 'text-amber-500 dark:text-amber-400' }
  return { text: 'Iniciando', color: 'text-rose-500 dark:text-rose-400' }
}

export default function PatientPeiGoals({ peiGoals, incrementPeiTrial }) {
  const [searchGoal, setSearchGoal] = useState('')
  const [filterCategory, setFilterCategory] = useState('TODAS')
  const [animKey, setAnimKey] = useState(0)

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

  const handleIncrement = (id) => {
    incrementPeiTrial(id)
    setAnimKey(k => k + 1)
  }

  const completadas = peiGoals.filter(g => g.progress >= 100).length
  const total = peiGoals.length

  return (
    <div className="bg-white dark:bg-[#1E293B] rounded-xl p-6 shadow-sm border border-slate-200 dark:border-slate-800/60 transition-all duration-200">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
          <Target className="w-5 h-5 text-indigo-500" />
          Metas PEI
        </h2>
        <span className="text-xs font-semibold px-2 py-1 bg-indigo-50 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400 rounded-md flex items-center gap-1.5">
          <Trophy className="w-3.5 h-3.5" />
          {completadas}/{total}
        </span>
      </div>

      <div className="flex flex-wrap gap-2 mb-4">
        <div className="relative w-full sm:flex-1 sm:min-w-[160px]">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
          <input type="text" placeholder="Buscar meta..." value={searchGoal} onChange={e => setSearchGoal(e.target.value)} className="w-full pl-3 pr-8 py-1.5 text-xs bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-lg outline-none focus:ring-2 focus:ring-blue-500" />
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
        <div className="space-y-3">
          {goalsFiltrados.map((goal, idx) => {
            const pct = goal.progress
            const status = getStatusLabel(pct)
            return (
              <div
                key={goal.id}
                className={`p-4 rounded-xl border border-slate-100 dark:border-slate-700 ${getProgressBg(pct)} animate-in fade-in slide-in-from-bottom-2 duration-300`}
                style={{ animationDelay: `${idx * 50}ms`, animationFillMode: 'backwards' }}
              >
                <div className="flex justify-between items-start mb-2">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">{goal.category}</span>
                      <span className={`text-[10px] font-semibold ${status.color}`}>{status.text}</span>
                    </div>
                    <p className="text-sm font-semibold text-slate-900 dark:text-white truncate">{goal.goal}</p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0 ml-3">
                    <span className="text-xs font-mono font-bold text-slate-600 dark:text-slate-300 bg-white dark:bg-slate-900 px-2.5 py-1 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700 flex items-center gap-1">
                      <AnimatedCounter value={goal.trials} key={`${animKey}-${goal.id}`} />
                      <span className="text-slate-400">/</span>
                      {goal.totalTrials}
                    </span>
                    <button
                      onClick={() => handleIncrement(goal.id)}
                      disabled={goal.trials >= goal.totalTrials}
                      className="p-1.5 bg-indigo-100 hover:bg-indigo-200 text-indigo-600 dark:bg-indigo-900/50 dark:hover:bg-indigo-800 dark:text-indigo-300 rounded-md disabled:opacity-50 disabled:cursor-not-allowed transition-all hover:scale-110 active:scale-95"
                      title="Registrar ensayo"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                <div className="relative mt-3">
                  <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-3 overflow-hidden">
                    <div
                      className={`h-3 rounded-full transition-all duration-700 ease-out ${getProgressColor(pct)} relative`}
                      style={{ width: `${pct}%` }}
                    >
                      <div className="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent rounded-full"></div>
                    </div>
                  </div>
                  <span className="absolute right-0 -top-4 text-[10px] font-bold text-slate-400">
                    {Math.round(pct)}%
                  </span>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
