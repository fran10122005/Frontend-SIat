import Sidebar from './Sidebar'

export default function Placeholder({ title }) {
  return (
    <div className="flex h-[100dvh] w-full bg-slate-50 dark:bg-slate-900 font-sans overflow-hidden transition-colors duration-200">
      <Sidebar />
      <main className="flex-1 flex flex-col h-full overflow-hidden items-center justify-center">
        <div className="text-center p-8">
          <div className="w-20 h-20 bg-gray-100 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-6 text-4xl shadow-sm border border-gray-200 dark:border-slate-700">
            🚧
          </div>
          <h2 className="text-2xl font-bold text-brand-700 dark:text-blue-400 mb-3">{title}</h2>
          <p className="text-gray-500 dark:text-gray-400 max-w-md mx-auto">
            Este módulo se encuentra actualmente en desarrollo y estará disponible en próximas actualizaciones.
          </p>
        </div>
      </main>
    </div>
  )
}
