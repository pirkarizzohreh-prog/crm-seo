import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Clock, Plus } from 'lucide-react'
import { useState } from 'react'
import { FormError } from '../components/FormError'
import { JalaliDateInput } from '../components/JalaliDateInput'
import { EmptyState, PageHeader } from '../components/Layout'
import { Modal } from '../components/Modal'
import { api } from '../lib/api'
import { formatDate, formatHours } from '../lib/format'
import type { Paginated, Task, TimeEntry } from '../types'

type EntryForm = {
  task?: number
  date: string
  duration_hours: string
  notes: string
}

const today = new Date().toISOString().slice(0, 10)
const emptyForm: EntryForm = { date: today, duration_hours: '', notes: '' }

export function TimeTrackerPage() {
  const queryClient = useQueryClient()
  const [adding, setAdding] = useState<EntryForm | null>(null)

  const { data: entries, isLoading } = useQuery<Paginated<TimeEntry>>({
    queryKey: ['time-entries'],
    queryFn: async () => (await api.get('/time/entries/')).data,
  })

  const { data: tasks } = useQuery<Paginated<Task>>({
    queryKey: ['tasks', {}],
    queryFn: async () => (await api.get('/tasks/')).data,
  })

  const create = useMutation({
    mutationFn: (entry: EntryForm) => api.post('/time/entries/', entry),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['time-entries'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard'] })
      setAdding(null)
    },
  })

  const totalHours =
    entries?.results.reduce((sum, e) => sum + parseFloat(e.duration_hours), 0) ?? 0

  return (
    <div>
      <PageHeader
        title="گزارش زمان"
        subtitle={
          <>
            مجموع ثبت‌شده: <span className="font-semibold text-slate-700">{formatHours(totalHours)}</span>
          </>
        }
        actions={
          <button onClick={() => setAdding(emptyForm)} className="btn-primary">
            <Plus className="h-4 w-4" /> ثبت دستی زمان
          </button>
        }
      />

      {isLoading ? (
        <p className="text-sm text-slate-500">در حال بارگذاری...</p>
      ) : !entries || entries.results.length === 0 ? (
        <EmptyState icon={Clock} title="هنوز زمانی ثبت نشده است." />
      ) : (
        <div className="card overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-xs text-slate-500">
                <th className="px-4 py-3 text-start">تاریخ</th>
                <th className="px-4 py-3 text-start">تسک</th>
                <th className="px-4 py-3 text-start">پروژه</th>
                <th className="px-4 py-3 text-start">مدت</th>
                <th className="px-4 py-3 text-start">یادداشت</th>
              </tr>
            </thead>
            <tbody>
              {entries.results.map((entry) => (
                <tr key={entry.id} className="border-b border-slate-100 last:border-0 hover:bg-slate-50/60">
                  <td className="px-4 py-3 text-slate-600">{formatDate(entry.date)}</td>
                  <td className="px-4 py-3 font-medium text-slate-900">{entry.task_title}</td>
                  <td className="px-4 py-3 text-slate-500">{entry.project_name}</td>
                  <td className="px-4 py-3 text-slate-600">{formatHours(entry.duration_hours)}</td>
                  <td className="px-4 py-3 text-slate-500">{entry.notes || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {adding && (
        <Modal title="ثبت دستی زمان" onClose={() => setAdding(null)}>
          <form
            onSubmit={(e) => {
              e.preventDefault()
              create.mutate(adding)
            }}
            className="space-y-3"
          >
            <div>
              <label className="field-label">تسک *</label>
              <select
                required
                value={adding.task ?? ''}
                onChange={(e) => setAdding({ ...adding, task: Number(e.target.value) })}
                className="field-input"
              >
                <option value="" disabled>
                  انتخاب کنید
                </option>
                {tasks?.results.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.project_name} — {t.title}
                  </option>
                ))}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="field-label">تاریخ</label>
                <JalaliDateInput required value={adding.date} onChange={(iso) => setAdding({ ...adding, date: iso })} />
              </div>
              <div>
                <label className="field-label">مدت (ساعت)</label>
                <input
                  required
                  type="number"
                  step="0.25"
                  value={adding.duration_hours}
                  onChange={(e) => setAdding({ ...adding, duration_hours: e.target.value })}
                  className="field-input ltr-nums"
                />
              </div>
            </div>
            <div>
              <label className="field-label">یادداشت</label>
              <textarea
                value={adding.notes}
                onChange={(e) => setAdding({ ...adding, notes: e.target.value })}
                className="field-input"
                rows={2}
              />
            </div>
            <FormError error={create.error} />
            <button type="submit" disabled={create.isPending} className="btn-primary w-full">
              ذخیره
            </button>
          </form>
        </Modal>
      )}
    </div>
  )
}
