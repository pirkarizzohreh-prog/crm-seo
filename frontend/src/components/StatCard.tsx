import type { ReactNode } from 'react'

export function StatCard({
  title,
  value,
  subtitle,
  tone = 'default',
  icon,
}: {
  title: string
  value: ReactNode
  subtitle?: ReactNode
  tone?: 'default' | 'warning' | 'danger' | 'success'
  icon?: ReactNode
}) {
  const toneClasses: Record<string, string> = {
    default: 'border-slate-200',
    warning: 'border-amber-300 bg-amber-50/50',
    danger: 'border-rose-300 bg-rose-50/50',
    success: 'border-emerald-300 bg-emerald-50/50',
  }

  return (
    <div className={`rounded-xl border bg-white p-4 shadow-sm ${toneClasses[tone]}`}>
      <div className="flex items-center justify-between text-sm text-slate-500">
        <span>{title}</span>
        {icon}
      </div>
      <div className="mt-2 text-2xl font-bold text-slate-900">{value}</div>
      {subtitle && <div className="mt-1 text-xs text-slate-500">{subtitle}</div>}
    </div>
  )
}
