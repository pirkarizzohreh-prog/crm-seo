import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { PageHeader } from '../components/Layout'
import { Modal } from '../components/Modal'
import { api } from '../lib/api'
import { formatHours } from '../lib/format'
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
        actions={
          <button
            onClick={() => setAdding(emptyForm)}
            className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800"
          >
            + ثبت دستی زمان
          </button>
        }
      />

      <p className="mb-4 text-sm text-slate-500">
        مجموع ثبت‌شده: <span className="ltr-nums font-semibold text-slate-900">{formatHours(totalHours)}</span>
      </p>

      {isLoading ? (
        <p className="text-sm text-slate-500">در حال بارگذاری...</p>
      ) : !entries || entries.results.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-300 bg-white p-8 text-center text-sm text-slate-400">
          هنوز زمانی ثبت نشده است.
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
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
                <tr key={entry.id} className="border-b border-slate-100 last:border-0">
                  <td className="ltr-nums px-4 py-3 text-slate-600">{entry.date}</td>
                  <td className="px-4 py-3 font-medium text-slate-900">{entry.task_title}</td>
                  <td className="px-4 py-3 text-slate-500">{entry.project_name}</td>
                  <td className="ltr-nums px-4 py-3 text-slate-600">{formatHours(entry.duration_hours)}</td>
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
              <label className="mb-1 block text-sm font-medium text-slate-700">تسک *</label>
              <select
                required
                value={adding.task ?? ''}
                onChange={(e) => setAdding({ ...adding, task: Number(e.target.value) })}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
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
                <label className="mb-1 block text-sm font-medium text-slate-700">تاریخ</label>
                <input
                  type="date"
                  value={adding.date}
                  onChange={(e) => setAdding({ ...adding, date: e.target.value })}
                  className="ltr-nums w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">مدت (ساعت)</label>
                <input
                  required
                  type="number"
                  step="0.25"
                  value={adding.duration_hours}
                  onChange={(e) => setAdding({ ...adding, duration_hours: e.target.value })}
                  className="ltr-nums w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                />
              </div>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">یادداشت</label>
              <textarea
                value={adding.notes}
                onChange={(e) => setAdding({ ...adding, notes: e.target.value })}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                rows={2}
              />
            </div>
            <button
              type="submit"
              disabled={create.isPending}
              className="w-full rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-50"
            >
              ذخیره
            </button>
          </form>
        </Modal>
      )}
    </div>
  )
}
