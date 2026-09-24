import { Archive, ChevronDown, ChevronLeft, RotateCcw } from 'lucide-react'
import { useState } from 'react'
import { formatDate, formatHours, formatToman } from '../lib/format'
import { jalaliMonthNames, toJalali } from '../lib/jalali'
import type { Task } from '../types'
import { EmptyState } from './Layout'

interface MonthGroup {
  key: string
  jy: number
  jm: number
  tasks: Task[]
}

/** Groups completed tasks by the Jalali month they were finished in — a
 * "بایگانی" (archive) that needs no manual filing: completed_at already
 * says which month a task belongs to, so it's always accurate and there's
 * nothing to type. Restoring a task just flips its status back. */
export function TaskArchivePanel({ tasks, onRestore }: { tasks: Task[]; onRestore: (taskId: number) => void }) {
  const doneTasks = tasks.filter((t) => t.status === 'done' && t.completed_at)

  const groupsByKey = new Map<string, MonthGroup>()
  for (const task of doneTasks) {
    const { jy, jm } = toJalali(new Date(task.completed_at as string))
    const key = `${jy}-${jm}`
    if (!groupsByKey.has(key)) groupsByKey.set(key, { key, jy, jm, tasks: [] })
    groupsByKey.get(key)!.tasks.push(task)
  }
  const groups = [...groupsByKey.values()].sort((a, b) => b.jy - a.jy || b.jm - a.jm)

  const [openKey, setOpenKey] = useState<string | null>(groups[0]?.key ?? null)

  if (doneTasks.length === 0) {
    return <EmptyState icon={Archive} title="هنوز تسک تکمیل‌شده‌ای برای بایگانی وجود ندارد." />
  }

  return (
    <div className="space-y-3">
      {groups.map((group) => {
        const isOpen = openKey === group.key
        const totalHours = group.tasks.reduce((sum, t) => sum + parseFloat(String(t.actual_hours || 0)), 0)
        return (
          <div key={group.key} className="card overflow-hidden">
            <button
              onClick={() => setOpenKey(isOpen ? null : group.key)}
              className="flex w-full items-center justify-between p-4 text-start"
            >
              <div className="flex items-center gap-2">
                {isOpen ? (
                  <ChevronDown className="h-4 w-4 shrink-0 text-slate-400" />
                ) : (
                  <ChevronLeft className="h-4 w-4 shrink-0 text-slate-400" />
                )}
                <span className="font-medium text-slate-900">
                  تسک‌های {jalaliMonthNames[group.jm - 1]} {group.jy}
                </span>
              </div>
              <span className="shrink-0 text-xs text-slate-500">
                {group.tasks.length} تسک · {formatHours(totalHours)}
              </span>
            </button>
            {isOpen && (
              <ul className="divide-y divide-slate-100 border-t border-slate-100">
                {group.tasks.map((task) => (
                  <li key={task.id} className="flex items-center justify-between gap-3 p-3 text-sm">
                    <div className="min-w-0">
                      <div className="font-medium text-slate-800">{task.title}</div>
                      <div className="text-xs text-slate-400">
                        تکمیل: {formatDate(task.completed_at)} · {formatHours(task.actual_hours)}
                        {task.value_generated && ` · ${formatToman(task.value_generated)}`}
                      </div>
                    </div>
                    <button
                      onClick={() => onRestore(task.id)}
                      className="shrink-0 rounded-md p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
                      title="بازگردانی به لیست فعال"
                    >
                      <RotateCcw className="h-4 w-4" />
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )
      })}
    </div>
  )
}
