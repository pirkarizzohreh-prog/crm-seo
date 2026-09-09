import type { LucideIcon } from 'lucide-react'
import type { ReactNode } from 'react'

const toneStyles: Record<string, { border: string; iconBg: string; iconColor: string }> = {
  default: { border: 'border-slate-200/70', iconBg: 'bg-slate-100', iconColor: 'text-slate-500' },
  brand: { border: 'border-slate-200/70', iconBg: 'bg-brand-50', iconColor: 'text-brand-600' },
  warning: { border: 'border-amber-200 bg-amber-50/40', iconBg: 'bg-amber-100', iconColor: 'text-amber-600' },
  danger: { border: 'border-rose-200 bg-rose-50/40', iconBg: 'bg-rose-100', iconColor: 'text-rose-600' },
  success: { border: 'border-emerald-200 bg-emerald-50/40', iconBg: 'bg-emerald-100', iconColor: 'text-emerald-600' },
}

export function StatCard({
  title,
  value,
  subtitle,
  tone = 'default',
  icon: Icon,
}: {
  title: string
  value: ReactNode
  subtitle?: ReactNode
  tone?: 'default' | 'brand' | 'warning' | 'danger' | 'success'
  icon?: LucideIcon
}) {
  const styles = toneStyles[tone]

  return (
    <div className={`card border p-4 ${styles.border}`}>
      <div className="flex items-center justify-between">
        <span className="text-sm text-slate-500">{title}</span>
        {Icon && (
          <span className={`flex h-8 w-8 items-center justify-center rounded-lg ${styles.iconBg} ${styles.iconColor}`}>
            <Icon className="h-4 w-4" strokeWidth={2} />
          </span>
        )}
      </div>
      <div className="mt-2 text-2xl font-bold text-slate-900">{value}</div>
      {subtitle && <div className="mt-1 text-xs text-slate-500">{subtitle}</div>}
    </div>
  )
}
