import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Coins, Pencil, Plus, Trash2, Wallet } from 'lucide-react'
import { useState } from 'react'
import { api } from '../lib/api'
import { formatDate, formatToman, gregorianMonthNames } from '../lib/format'
import { useMe } from '../lib/useMe'
import type { Paginated, Payment, PaymentSummary } from '../types'
import { EmptyState } from './Layout'
import { FormError } from './FormError'
import { JalaliDateInput } from './JalaliDateInput'
import { Modal } from './Modal'
import { StatCard } from './StatCard'

type PaymentForm = Partial<Payment>

export function PaymentsPanel({ projectId }: { projectId: number }) {
  const queryClient = useQueryClient()
  const now = new Date()
  const [year, setYear] = useState(now.getFullYear())
  const [month, setMonth] = useState(now.getMonth() + 1)
  const [editing, setEditing] = useState<PaymentForm | null>(null)
  const { data: me } = useMe()
  const canEdit = me?.is_owner ?? false

  const { data: summary, isLoading: loadingSummary } = useQuery<PaymentSummary>({
    queryKey: ['payment-summary', projectId, year, month],
    queryFn: async () =>
      (await api.get(`/projects/${projectId}/payment-summary/`, { params: { year, month } })).data,
  })

  const { data: payments, isLoading: loadingPayments } = useQuery<Paginated<Payment>>({
    queryKey: ['payments', { project: projectId }],
    queryFn: async () =>
      (await api.get('/projects/payments/', { params: { project: projectId, page_size: 200 } })).data,
  })

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ['payment-summary'] })
    queryClient.invalidateQueries({ queryKey: ['payments'] })
  }

  const save = useMutation({
    mutationFn: (payment: PaymentForm) => {
      const payload = { ...payment, project: projectId }
      return payment.id
        ? api.patch(`/projects/payments/${payment.id}/`, payload)
        : api.post('/projects/payments/', payload)
    },
    onSuccess: () => {
      invalidate()
      setEditing(null)
    },
  })

  const remove = useMutation({
    mutationFn: (id: number) => api.delete(`/projects/payments/${id}/`),
    onSuccess: invalidate,
  })

  const list = payments?.results ?? []

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <select value={month} onChange={(e) => setMonth(Number(e.target.value))} className="field-input w-auto">
            {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
              <option key={m} value={m}>
                {gregorianMonthNames[m - 1]}
              </option>
            ))}
          </select>
          <input
            type="number"
            value={year}
            onChange={(e) => setYear(Number(e.target.value))}
            className="field-input ltr-nums w-24"
          />
        </div>
        {canEdit && (
          <button onClick={() => setEditing({ received_on: '', amount: '' })} className="btn-primary">
            <Plus className="h-4 w-4" /> ثبت دریافتی جدید
          </button>
        )}
      </div>

      {loadingSummary || !summary ? (
        <p className="text-sm text-slate-500">در حال بارگذاری...</p>
      ) : (
        <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard title="مبلغ قرارداد (این ماه)" value={formatToman(summary.expected_contract_amount)} icon={Coins} />
          <StatCard
            title="ارزش ساعات کاری (این ماه)"
            value={formatToman(summary.expected_from_hours)}
            icon={Wallet}
          />
          <StatCard
            title="دریافتی این ماه"
            value={formatToman(summary.period_received)}
            icon={Coins}
            tone="success"
          />
          <StatCard
            title="مجموع دریافتی از شروع پروژه"
            value={formatToman(summary.total_received_all_time)}
            icon={Wallet}
            tone="brand"
          />
        </div>
      )}

      {loadingPayments ? (
        <p className="text-sm text-slate-500">در حال بارگذاری...</p>
      ) : list.length === 0 ? (
        <EmptyState icon={Coins} title="هنوز دریافتی‌ای برای این پروژه ثبت نشده است." />
      ) : (
        <div className="card overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-xs text-slate-500">
                <th className="px-4 py-3 text-start">تاریخ دریافت</th>
                <th className="px-4 py-3 text-start">مبلغ</th>
                <th className="px-4 py-3 text-start">یادداشت</th>
                {canEdit && <th className="px-4 py-3" />}
              </tr>
            </thead>
            <tbody>
              {list.map((p) => (
                <tr key={p.id} className="border-b border-slate-100 last:border-0 hover:bg-slate-50/60">
                  <td className="px-4 py-3 text-slate-600">{formatDate(p.received_on)}</td>
                  <td className="px-4 py-3 font-medium text-slate-900">{formatToman(p.amount)}</td>
                  <td className="px-4 py-3 text-slate-500">{p.notes || '—'}</td>
                  {canEdit && (
                    <td className="px-4 py-3 text-end">
                      <div className="flex justify-end gap-1">
                        <button
                          onClick={() => setEditing(p)}
                          className="rounded-md p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
                        >
                          <Pencil className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => {
                            if (confirm('این دریافتی حذف شود؟')) remove.mutate(p.id!)
                          }}
                          className="rounded-md p-1.5 text-slate-400 hover:bg-rose-50 hover:text-rose-600"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {editing && (
        <Modal title={editing.id ? 'ویرایش دریافتی' : 'ثبت دریافتی جدید'} onClose={() => setEditing(null)}>
          <form
            onSubmit={(e) => {
              e.preventDefault()
              save.mutate(editing)
            }}
            className="space-y-3"
          >
            <div>
              <label className="field-label">مبلغ (تومان) *</label>
              <input
                required
                type="number"
                value={editing.amount ?? ''}
                onChange={(e) => setEditing({ ...editing, amount: e.target.value })}
                className="field-input ltr-nums"
              />
            </div>
            <div>
              <label className="field-label">تاریخ دریافت *</label>
              <JalaliDateInput
                required
                value={editing.received_on}
                onChange={(iso) => setEditing({ ...editing, received_on: iso })}
              />
            </div>
            <div>
              <label className="field-label">یادداشت</label>
              <input
                value={editing.notes ?? ''}
                onChange={(e) => setEditing({ ...editing, notes: e.target.value })}
                className="field-input"
                placeholder="مثلاً «قسط اول»، «تسویه نهایی»..."
              />
            </div>
            <FormError error={save.error} />
            <button type="submit" disabled={save.isPending} className="btn-primary w-full">
              ذخیره
            </button>
          </form>
        </Modal>
      )}
    </div>
  )
}
