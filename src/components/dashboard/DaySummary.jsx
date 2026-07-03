import { Moon, Utensils, AlertTriangle, ListTodo, MessageSquare } from 'lucide-react'

const mockHomeData = { animo: 'Alegre', sueno: '8h (Bueno)', apetito: 'Normal', crisisCount: 0 }
const mockAgenda = [
  { id: 1, task: 'Lavarse los dientes', time: '08:00', done: true, icon: 'wash' },
  { id: 2, task: 'Desayuno terapéutico', time: '08:30', done: true, icon: 'food' },
  { id: 3, task: 'Integración sensorial', time: '10:00', done: false, icon: 'puzzle' },
  { id: 4, task: 'Actividad educativa', time: '14:00', done: false, icon: 'study' },
]

export default function DaySummary({ homeData, agenda, indicacion, onNavigate }) {
  const hoy = new Date().toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' })

  const data = homeData || mockHomeData
  const tareas = (agenda && agenda.length > 0) ? agenda : mockAgenda

  const animoIcons = { 'Alegre': '😊', 'Neutral': '😐', 'Irritable': '😠', 'Triste': '😢' }
  const animo = data?.animo || '—'
  const sueno = data?.sueno || '—'
  const apetito = data?.apetito || '—'
  const crisisHoy = data?.crisisCount ?? 0
  const tareasCompletadas = tareas?.filter(t => t.done).length ?? 0
  const tareasTotal = tareas?.length ?? 0

  return (
    <div className="bg-white dark:bg-[#1E293B] rounded-2xl p-6 shadow-sm border border-slate-200 dark:border-slate-800/60">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
          <ListTodo className="w-4 h-4 text-indigo-500" />
          Resumen de Hoy
        </h3>
        <span className="text-[10px] font-semibold text-slate-400 capitalize">{hoy}</span>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-700">
          <span className="text-xl">{animoIcons[animo] || '—'}</span>
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Ánimo</p>
            <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">{animo}</p>
          </div>
        </div>

        <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-700">
          <Moon className="w-5 h-5 text-indigo-400" />
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Sueño</p>
            <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">{sueno}</p>
          </div>
        </div>

        <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-700">
          <Utensils className="w-5 h-5 text-amber-400" />
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Apetito</p>
            <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">{apetito}</p>
          </div>
        </div>

        <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-700">
          <AlertTriangle className={`w-5 h-5 ${crisisHoy > 0 ? 'text-rose-500' : 'text-emerald-400'}`} />
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Crisis hoy</p>
            <p className={`text-sm font-semibold ${crisisHoy > 0 ? 'text-rose-600 dark:text-rose-400' : 'text-emerald-600 dark:text-emerald-400'}`}>
              {crisisHoy}
            </p>
          </div>
        </div>
      </div>

      <div className="mt-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-700 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <ListTodo className="w-4 h-4 text-blue-400" />
          <span className="text-xs font-semibold text-slate-600 dark:text-slate-400">Agenda de hoy</span>
        </div>
        <button
          onClick={() => onNavigate('agenda')}
          className="text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline"
        >
          {tareasCompletadas}/{tareasTotal} tareas
        </button>
      </div>

      {indicacion && (
        <div className="mt-3 p-3 rounded-xl bg-indigo-50 dark:bg-indigo-950/30 border border-indigo-100 dark:border-indigo-900/30 flex items-start gap-3">
          <MessageSquare className="w-4 h-4 text-indigo-500 mt-0.5 shrink-0" />
          <div>
            <p className="text-[10px] font-bold text-indigo-500 uppercase tracking-wider">Indicación del especialista</p>
            <p className="text-xs font-medium text-indigo-900 dark:text-indigo-200 mt-0.5">{indicacion}</p>
          </div>
        </div>
      )}
    </div>
  )
}
