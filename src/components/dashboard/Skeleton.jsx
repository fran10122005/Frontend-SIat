import React from 'react'

export function Skeleton({ className = '', variant = 'rect', ...props }) {
  const baseClass = 'relative overflow-hidden bg-slate-200 dark:bg-slate-800 motion-safe:animate-pulse'
  const variantClasses = {
    rect: 'rounded-xl',
    circle: 'rounded-full',
    text: 'h-4 w-full rounded-md'
  }

  return (
    <div 
      className={`${baseClass} ${variantClasses[variant] || ''} ${className}`} 
      {...props} 
    >
      <div className="absolute inset-0 -translate-x-full motion-safe:animate-[shimmer_2s_infinite] bg-gradient-to-r from-transparent via-white/20 dark:via-white/5 to-transparent" />
    </div>
  )
}

export function DashboardSkeleton() {
  return (
    <div className="w-full space-y-6 p-6">
      <div className="flex justify-between items-center mb-4">
        <div className="space-y-2">
          <Skeleton variant="text" className="w-48 h-6" />
          <Skeleton variant="text" className="w-32 h-4" />
        </div>
        <Skeleton variant="circle" className="w-10 h-10" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Skeleton className="h-32" />
        <Skeleton className="h-32" />
        <Skeleton className="h-32" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          <Skeleton className="h-64" />
        </div>
        <div className="space-y-4">
          <Skeleton className="h-64" />
        </div>
      </div>
    </div>
  )
}

export function TableSkeleton({ rows = 5, cols = 4 }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex gap-4">
          {Array.from({ length: cols }).map((_, j) => (
            <Skeleton key={j} className="h-10 flex-1" />
          ))}
        </div>
      ))}
    </div>
  )
}

export function CardSkeleton({ count = 3 }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="bg-white dark:bg-slate-800/50 rounded-card p-6 space-y-4 border border-slate-200/60 dark:border-slate-700/50">
          <div className="flex items-center gap-3">
            <Skeleton variant="circle" className="w-10 h-10" />
            <div className="space-y-2 flex-1">
              <Skeleton variant="text" className="w-3/4 h-4" />
              <Skeleton variant="text" className="w-1/2 h-3" />
            </div>
          </div>
          <Skeleton className="h-20" />
          <Skeleton variant="text" className="w-1/3 h-3" />
        </div>
      ))}
    </div>
  )
}
