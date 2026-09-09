export function Badge({ label, className }: { label: string; className?: string }) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${className ?? 'bg-slate-100 text-slate-600'}`}
    >
      {label}
    </span>
  )
}

export function DotBadge({ label, className }: { label: string; className?: string }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium ${className ?? 'bg-slate-100 text-slate-600'}`}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-current" />
      {label}
    </span>
  )
}
