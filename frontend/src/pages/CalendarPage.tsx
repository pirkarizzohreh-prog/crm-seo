import { useQuery } from '@tanstack/react-query'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Badge } from '../components/Badge'
import { PageHeader } from '../components/Layout'
import { api } from '../lib/api'
import { addJalaliMonths, jalaliMonthLength, jalaliMonthNames, jalaliToGregorian, toJalali } from '../lib/jalali'
import { priorityColors, priorityLabels } from '../lib/labels'
import type { Paginated, Task } from '../types'

const weekDays = ['شنبه', 'یک‌شنبه', 'دوشنبه', 'سه‌شنبه', 'چهارشنبه', 'پنجشنبه', 'جمعه']

function toISODate(d: Date): string {
  return d.toISOString().slice(0, 10)
}

// JS getDay(): 0=Sunday..6=Saturday. Our week starts Saturday (Iranian week).
function jsDayToColumn(jsDay: number): number {
  return (jsDay + 1) % 7
}

export function CalendarPage() {
  const today = new Date()
  const todayJalali = toJalali(today)
  const [cursor, setCursor] = useState({ jy: todayJalali.jy, jm: todayJalali.jm })

  const { data } = useQuery<Paginated<Task>>({
    queryKey: ['tasks', { forCalendar: true }],
    queryFn: async () => (await api.get('/tasks/', { params: { page_size: 500 } })).data,
  })

  const tasksByDate = useMemo(() => {
    const map = new Map<string, Task[]>()
    for (const task of data?.results ?? []) {
      if (!task.deadline) continue
      const list = map.get(task.deadline) ?? []
      list.push(task)
      map.set(task.deadline, list)
    }
    return map
  }, [data])

  const { jy, jm } = cursor
  const daysInMonth = jalaliMonthLength(jy, jm)
  const firstOfMonth = jalaliToGregorian(jy, jm, 1)
  const leadingBlanks = jsDayToColumn(firstOfMonth.getDay())

  const cells: (number | null)[] = [
    ...Array(leadingBlanks).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ]
  while (cells.length % 7 !== 0) cells.push(null)

  const todayISO = toISODate(today)

  return (
    <div>
      <PageHeader
        title="تقویم"
        subtitle="تسک‌ها بر اساس موعد انجام"
        actions={
          <div className="flex items-center gap-2">
            <button
              onClick={() => setCursor(addJalaliMonths(jy, jm, -1))}
              className="btn-secondary !px-2 !py-1.5"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
            <span className="min-w-32 text-center text-sm font-medium text-slate-700">
              {jalaliMonthNames[jm - 1]} {jy}
            </span>
            <button
              onClick={() => setCursor(addJalaliMonths(jy, jm, 1))}
              className="btn-secondary !px-2 !py-1.5"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button onClick={() => setCursor({ jy: todayJalali.jy, jm: todayJalali.jm })} className="btn-secondary">
              امروز
            </button>
          </div>
        }
      />

      <div className="card overflow-hidden">
        <div className="grid grid-cols-7 border-b border-slate-200 bg-slate-50 text-xs font-medium text-slate-500">
          {weekDays.map((day) => (
            <div key={day} className="px-2 py-2 text-center">
              {day}
            </div>
          ))}
        </div>
        <div className="grid grid-cols-7">
          {cells.map((jd, i) => {
            const date = jd ? jalaliToGregorian(jy, jm, jd) : null
            const iso = date ? toISODate(date) : null
            const dayTasks = iso ? tasksByDate.get(iso) ?? [] : []
            const isToday = iso === todayISO
            return (
              <div
                key={i}
                className={`min-h-28 border-b border-e border-slate-100 p-1.5 [&:nth-child(7n)]:border-e-0 ${
                  jd ? '' : 'bg-slate-50/50'
                }`}
              >
                {jd && (
                  <>
                    <div
                      className={`mb-1 flex h-6 w-6 items-center justify-center rounded-full text-xs ${
                        isToday ? 'bg-brand-600 font-bold text-white' : 'text-slate-500'
                      }`}
                    >
                      {jd}
                    </div>
                    <div className="space-y-1">
                      {dayTasks.slice(0, 3).map((task) => (
                        <Link
                          key={task.id}
                          to={`/projects/${task.project}`}
                          className={`block truncate rounded px-1.5 py-0.5 text-[11px] font-medium ${priorityColors[task.priority]}`}
                          title={task.title}
                        >
                          {task.title}
                        </Link>
                      ))}
                      {dayTasks.length > 3 && (
                        <div className="px-1.5 text-[11px] text-slate-400">+{dayTasks.length - 3} مورد دیگر</div>
                      )}
                    </div>
                  </>
                )}
              </div>
            )
          })}
        </div>
      </div>

      <div className="mt-4 flex flex-wrap gap-2 text-xs text-slate-500">
        <span>اولویت:</span>
        {Object.entries(priorityLabels)
          .filter(([v]) => ['low', 'medium', 'high', 'urgent'].includes(v))
          .map(([value, label]) => (
            <Badge key={value} label={label} className={priorityColors[value]} />
          ))}
      </div>
    </div>
  )
}
