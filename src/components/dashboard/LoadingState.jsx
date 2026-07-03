import { Skeleton, DashboardSkeleton, TableSkeleton, CardSkeleton } from './Skeleton'
import { Loader2 } from 'lucide-react'

const roleMessages = {
  ADMIN_INSTITUCION: {
    dashboard: 'Cargando panel de administración...',
    table: 'Cargando usuarios del sistema...',
    profile: 'Cargando perfil del administrador...',
    form: 'Preparando formulario...',
    default: 'Cargando información del sistema...',
  },
  ESPECIALISTA: {
    dashboard: 'Preparando tu dashboard clínico...',
    table: 'Cargando lista de pacientes...',
    profile: 'Cargando perfil del especialista...',
    form: 'Preparando datos clínicos...',
    default: 'Cargando información clínica...',
  },
  REPRESENTANTE: {
    dashboard: 'Cargando información de tu hijo...',
    table: 'Cargando registro de actividades...',
    profile: 'Cargando perfil familiar...',
    form: 'Preparando datos del hogar...',
    default: 'Un momento, estamos listando todo...',
  },
}

export default function LoadingState({
  variant = 'spinner',
  message,
  role,
  rows,
  count,
  className = '',
}) {
  const { userRole } = typeof window !== 'undefined'
    ? { userRole: localStorage.getItem('userRole') || 'REPRESENTANTE' }
    : { userRole: 'REPRESENTANTE' }

  const currentRole = role || userRole
  const msgs = roleMessages[currentRole] || roleMessages.REPRESENTANTE
  const resolvedMessage = message || msgs[variant] || msgs.default

  const renderContent = () => {
    switch (variant) {
      case 'dashboard':
        return <DashboardSkeleton />
      case 'table':
        return <TableSkeleton rows={rows} cols={4} />
      case 'card':
        return <CardSkeleton count={count} />
      case 'profile':
        return <ProfileSkeleton />
      case 'form':
        return <FormSkeleton />
      case 'spinner':
      default:
        return (
          <div className="flex flex-col items-center justify-center gap-4 py-16">
            <Loader2 className="w-8 h-8 text-blue-600 dark:text-blue-400 animate-spin" />
          </div>
        )
    }
  }

  return (
    <div className={`w-full ${className}`} role="status" aria-label="Cargando">
      {(variant !== 'spinner' || message) && (
        <div className="mb-6">
          <p className="text-sm font-medium text-slate-500 dark:text-slate-400 flex items-center gap-2">
            <Loader2 className="w-4 h-4 animate-spin" />
            {resolvedMessage}
          </p>
        </div>
      )}
      {renderContent()}
    </div>
  )
}

function ProfileSkeleton() {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-1 space-y-6">
        <div className="bg-white dark:bg-slate-800/50 rounded-xl p-6 border border-slate-200/60 dark:border-slate-700/50 space-y-4">
          <div className="flex flex-col items-center gap-3">
            <Skeleton variant="circle" className="w-24 h-24" />
            <Skeleton variant="text" className="w-32 h-5" />
            <Skeleton variant="text" className="w-20 h-4" />
          </div>
          <div className="space-y-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="flex justify-between">
                <Skeleton variant="text" className="w-24 h-4" />
                <Skeleton variant="text" className="w-32 h-4" />
              </div>
            ))}
          </div>
        </div>
      </div>
      <div className="lg:col-span-2 space-y-6">
        <div className="bg-white dark:bg-slate-800/50 rounded-xl p-6 border border-slate-200/60 dark:border-slate-700/50 space-y-4">
          <Skeleton variant="text" className="w-40 h-5" />
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i}>
              <Skeleton variant="text" className="w-20 h-3 mb-1" />
              <Skeleton className="h-10" />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

function FormSkeleton() {
  return (
    <div className="bg-white dark:bg-slate-800/50 rounded-xl p-6 border border-slate-200/60 dark:border-slate-700/50 space-y-5">
      <Skeleton variant="text" className="w-48 h-6" />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i}>
            <Skeleton variant="text" className="w-24 h-3 mb-1.5" />
            <Skeleton className="h-10" />
          </div>
        ))}
      </div>
      <div>
        <Skeleton variant="text" className="w-24 h-3 mb-1.5" />
        <Skeleton className="h-10" />
      </div>
      <div className="flex justify-end">
        <Skeleton className="w-32 h-10" />
      </div>
    </div>
  )
}
