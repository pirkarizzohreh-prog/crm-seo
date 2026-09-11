import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Pencil, Trash2 } from 'lucide-react'
import { useState } from 'react'
import { api } from '../lib/api'
import { formatDate, formatHours } from '../lib/format'
import type { Paginated, Task, TimeEntry } from '../types'
import { FormError } from './FormError'
import { JalaliDateInput } from './JalaliDateInput'
import { Modal } from './Modal'

type EntryForm = { id?: number; date: string; duration_hours: string; notes: string }

const todayISO = new Date().toISOString().slice(0, 10)
const emptyForm: EntryForm = { date: todayISO, duration_hours: '', notes: '' }

/** Manages every logged time entry for one task — not just an "add hours"
 * form. Editing/deleting a specific past entry lives here too, because a
 * plain always-adds-a-new-entry form makes "I want to correct a wrong
 * number" look like it's stacking on top of what's already logged. */
export function TaskTimeEntriesModal({ task, onClose }: { task: Task; onClose: () => void }) {
  const queryClient = useQueryClient()
  const [form, setForm] = useState<EntryForm>(emptyForm)

  const { data: entries } = useQuery<Paginated<TimeEntry>>({
    queryKey: ['time-entries', { task: task.id }],
    queryFn: async () => (await api.get('/time/entries/', { params: { task: task.id } })).data,
  })

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ['time-entries'] })
    queryClient.invalidateQueries({ queryKey: ['tasks'] })
    queryClient.invalidateQueries({ queryKey: ['dashboard'] })
  }

  const save = useMutation({
    mutationFn: () => {
      const payload = { task: task.id, date: form.date, duration_hours: form.duration_hours, notes: form.notes }
      return form.id ? api.patch(`/time/entries/${form.id}/`, payload) : api.post('/time/entries/', payload)
    },
    onSuccess: () => {
      invalidate()
      setForm(emptyForm)
    },
  })

  const remove = useMutation({
    mutationFn: (id: number) => api.delete(`/time/entries/${id}/`),
    onSuccess: invalidate,
  })

  const list = entries?.results ?? []
  const total = list.reduce((sum, e) => sum + parseFloat(e.duration_hours), 0)

  return (
    <Modal title="ساعت‌های ثبت‌شده" onClose={onClose}>
      <p className="mb-3 text-sm text-slate-500">
        برای تسک <span className="font-medium text-slate-900">{task.title}</span>
      </p>

      {list.length > 0 && (
        <ul className="mb-4 max-h-48 space-y-1.5 overflow-y-auto">
          {list.map((entry) => (
            <li
              key={entry.id}
              className="flex items-center justify-between gap-2 rounded-lg border border-slate-200 p-2 text-sm"
            >
              <div className="min-w-0">
                <div className="font-medium text-slate-900">
                  {formatHours(entry.duration_hours)} — {formatDate(entry.date)}
                </div>
                {entry.notes && <div className="truncate text-xs text-slate-500">{entry.notes}</div>}
              </div>
              <div className="flex shrink-0 gap-1">
                <button
                  type="button"
                  onClick={() =>
                    setForm({ id: entry.id, date: entry.date, duration_hours: entry.duration_hours, notes: entry.notes })
                  }
                  className="rounded-md p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
                  title="ویرایش این ثبت"
                >
                  <Pencil className="h-3.5 w-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (confirm('این ثبت زمان حذف شود؟')) remove.mutate(entry.id)
                  }}
                  className="rounded-md p-1.5 text-slate-400 hover:bg-rose-50 hover:text-rose-600"
                  title="حذف"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}

      <div className="mb-3 flex items-center justify-between rounded-lg bg-slate-50 px-3 py-2 text-sm">
        <span className="text-slate-500">مجموع ساعت ثبت‌شده روی این تسک</span>
        <span className="font-semibold text-slate-900">{formatHours(total)}</span>
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault()
          save.mutate()
        }}
        className="space-y-3 border-t border-slate-100 pt-3"
      >
        <p className="text-xs font-medium text-slate-500">
          {form.id ? 'در حال ویرایش یک ثبت موجود' : 'افزودن یک ثبت جدید (به مجموع بالا اضافه می‌شود)'}
        </p>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="field-label">تاریخ</label>
            <JalaliDateInput required value={form.date} onChange={(iso) => setForm({ ...form, date: iso })} />
          </div>
          <div>
            <label className="field-label">مدت (ساعت)</label>
            <input
              required
              type="number"
              step="0.25"
              min="0.25"
              value={form.duration_hours}
              onChange={(e) => setForm({ ...form, duration_hours: e.target.value })}
              className="field-input ltr-nums"
            />
          </div>
        </div>
        <div>
          <label className="field-label">یادداشت</label>
          <textarea
            value={form.notes}
            onChange={(e) => setForm({ ...form, notes: e.target.value })}
            className="field-input"
            rows={2}
            placeholder="چه کاری انجام دادید؟"
          />
        </div>
        <FormError error={save.error} />
        <div className="flex gap-2">
          <button type="submit" disabled={save.isPending} className="btn-primary flex-1">
            {form.id ? 'ذخیره ویرایش' : 'افزودن ثبت جدید'}
          </button>
          {form.id && (
            <button type="button" onClick={() => setForm(emptyForm)} className="btn-secondary">
              انصراف از ویرایش
            </button>
          )}
        </div>
      </form>
    </Modal>
  )
}
