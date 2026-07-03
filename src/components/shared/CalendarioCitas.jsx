import { useState, useMemo } from 'react'
import { ChevronLeft, ChevronRight, Calendar, Clock } from 'lucide-react'

const meses = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre']
const diasSemana = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb']

const coloresEstado = {
  Programada: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300 border-blue-200 dark:border-blue-800',
  Completada: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800',
  Cancelada: 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400 border-slate-200 dark:border-slate-700',
  'No Asistió': 'bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-300 border-rose-200 dark:border-rose-800'
}

export default function CalendarioCitas({ citas = [], onSelectDate }) {
  const hoy = useMemo(() => new Date(), [])
  const [mesActual, setMesActual] = useState(hoy.getMonth())
  const [anoActual, setAnoActual] = useState(hoy.getFullYear())
  const [diaSeleccionado, setDiaSeleccionado] = useState(null)

  const diasDelMes = useMemo(() => {
    const firstDay = new Date(anoActual, mesActual, 1)
    const lastDay = new Date(anoActual, mesActual + 1, 0)
    const startPad = firstDay.getDay()
    const totalDays = lastDay.getDate()
    const days = []
    for (let i = 0; i < startPad; i++) days.push(null)
    for (let i = 1; i <= totalDays; i++) days.push(i)
    return days
  }, [mesActual, anoActual])

  const citasPorDia = useMemo(() => {
    const map = {}
    citas.forEach(c => {
      const fecha = c.cit_fech || c.fecha || ''
      if (!map[fecha]) map[fecha] = []
      map[fecha].push(c)
    })
    return map
  }, [citas])

  const citasDelDiaSeleccionado = diaSeleccionado
    ? citasPorDia[`${anoActual}-${String(mesActual + 1).padStart(2, '0')}-${String(diaSeleccionado).padStart(2, '0')}`] || []
    : []

  const navegar = (dir) => {
    if (dir === -1 && mesActual === 0) {
      setMesActual(11)
      setAnoActual(a => a - 1)
    } else if (dir === 1 && mesActual === 11) {
      setMesActual(0)
      setAnoActual(a => a + 1)
    } else {
      setMesActual(m => m + dir)
    }
    setDiaSeleccionado(null)
  }

  const irAHoy = () => {
    setMesActual(hoy.getMonth())
    setAnoActual(hoy.getFullYear())
    setDiaSeleccionado(hoy.getDate())
  }

  return (
    <div className="bg-white dark:bg-[#1E293B] rounded-xl shadow-sm border border-slate-200 dark:border-slate-800/60 overflow-hidden">
      <div className="p-4 border-b border-slate-200 dark:border-slate-700">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Calendar className="w-5 h-5 text-indigo-500" />
            Calendario de Citas
          </h2>
          <button
            onClick={irAHoy}
            className="px-3 py-1.5 text-xs font-semibold bg-indigo-50 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400 rounded-lg hover:bg-indigo-100 dark:hover:bg-indigo-900/50 transition-colors"
          >
            Hoy
          </button>
        </div>

        <div className="flex items-center justify-between mt-4">
          <button onClick={() => navegar(-1)} className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors">
            <ChevronLeft className="w-4 h-4 text-slate-500" />
          </button>
          <span className="text-sm font-bold text-slate-700 dark:text-slate-300">
            {meses[mesActual]} {anoActual}
          </span>
          <button onClick={() => navegar(1)} className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors">
            <ChevronRight className="w-4 h-4 text-slate-500" />
          </button>
        </div>
      </div>

      <div className="p-4">
        <div className="grid grid-cols-7 gap-1">
          {diasSemana.map(d => (
            <div key={d} className="text-center text-[10px] font-bold text-slate-400 dark:text-slate-500 py-1 uppercase tracking-wider">
              {d}
            </div>
          ))}
          {diasDelMes.map((dia, i) => {
            const fechaKey = dia ? `${anoActual}-${String(mesActual + 1).padStart(2, '0')}-${String(dia).padStart(2, '0')}` : null
            const citasDelDia = fechaKey ? citasPorDia[fechaKey] || [] : []
            const esHoy = dia === hoy.getDate() && mesActual === hoy.getMonth() && anoActual === hoy.getFullYear()
            const esSeleccionado = dia === diaSeleccionado

            return (
              <button
                key={i}
                disabled={!dia}
                onClick={() => dia && setDiaSeleccionado(dia)}
                className={`
                  relative aspect-square rounded-lg text-xs font-semibold transition-all flex flex-col items-center justify-center gap-0.5
                  ${!dia ? 'invisible' : ''}
                  ${esSeleccionado ? 'ring-2 ring-indigo-500 bg-indigo-50 dark:bg-indigo-900/30' : ''}
                  ${esHoy && !esSeleccionado ? 'bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400' : ''}
                  ${!esHoy && !esSeleccionado && dia ? 'hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300' : ''}
                `}
              >
                <span className="leading-none">{dia}</span>
                {citasDelDia.length > 0 && (
                  <span className="flex gap-0.5">
                    {citasDelDia.slice(0, 3).map((_, ci) => (
                      <span key={ci} className="w-1 h-1 rounded-full bg-indigo-400"></span>
                    ))}
                  </span>
                )}
              </button>
            )
          })}
        </div>
      </div>

      {diaSeleccionado && (
        <div className="border-t border-slate-200 dark:border-slate-700 p-4">
          <h3 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-3">
            Citas — {diaSeleccionado} de {meses[mesActual]}
          </h3>
          {citasDelDiaSeleccionado.length === 0 ? (
            <p className="text-xs text-slate-400 dark:text-slate-500 py-4 text-center">
              No hay citas programadas para este día.
            </p>
          ) : (
            <div className="space-y-2">
              {citasDelDiaSeleccionado.map((cita, ci) => {
                const colorClase = coloresEstado[cita.estado || cita.est_cita || 'Programada'] || coloresEstado.Programada
                return (
                  <div key={ci} className="flex items-center gap-3 p-3 rounded-lg border border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/40">
                    <Clock className="w-4 h-4 text-slate-400 shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-slate-800 dark:text-slate-200 truncate">
                        {cita.tipo || cita.tip_cita || 'Consulta'}
                      </p>
                      <p className="text-[10px] text-slate-400">
                        {cita.hora || cita.hor_cita || '—'} {cita.paciente || cita.nin_nomb ? `· ${cita.paciente || cita.nin_nomb}` : ''}
                      </p>
                    </div>
                    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${colorClase}`}>
                      {cita.estado || cita.est_cita || 'Programada'}
                    </span>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
