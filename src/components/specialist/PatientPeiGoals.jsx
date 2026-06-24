import { Target, Plus } from 'lucide-react'

export default function PatientPeiGoals({ peiGoals, incrementPeiTrial }) {
  return (
    <div className="bg-white dark:bg-[#1E293B] rounded-xl p-6 shadow-sm border border-slate-200 dark:border-slate-800/60 transition-all duration-200">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
          <Target className="w-5 h-5 text-indigo-500" />
          Metas PEI (Trial-by-trial)
        </h2>
        <span className="text-xs font-semibold px-2 py-1 bg-indigo-50 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400 rounded-md">
          Sesión Actual
        </span>
      </div>

      <div className="space-y-4">
        {peiGoals.map(goal => (
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
    </div>
  )
}
