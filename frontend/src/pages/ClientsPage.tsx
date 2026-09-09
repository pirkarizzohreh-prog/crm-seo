import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Pencil, Plus, Trash2, Users2 } from 'lucide-react'
import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Badge } from '../components/Badge'
import { EmptyState, PageHeader } from '../components/Layout'
import { Modal } from '../components/Modal'
import { api } from '../lib/api'
import { clientStatusLabels } from '../lib/labels'
import type { Client, ClientStatus, Paginated } from '../types'

type ClientForm = Partial<Client>

const emptyForm: ClientForm = {
  name: '',
  company_name: '',
  phone: '',
  email: '',
  website: '',
  industry: '',
  notes: '',
  status: 'active',
}

export function ClientsPage() {
  const queryClient = useQueryClient()
  const [editing, setEditing] = useState<ClientForm | null>(null)

  const { data, isLoading } = useQuery<Paginated<Client>>({
    queryKey: ['clients'],
    queryFn: async () => (await api.get('/clients/')).data,
  })

  const save = useMutation({
    mutationFn: (client: ClientForm) =>
      client.id ? api.patch(`/clients/${client.id}/`, client) : api.post('/clients/', client),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clients'] })
      setEditing(null)
    },
  })

  const remove = useMutation({
    mutationFn: (id: number) => api.delete(`/clients/${id}/`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['clients'] }),
  })

  const clients = data?.results ?? []

  return (
    <div>
      <PageHeader
        title="مشتری‌ها"
        actions={
          <button onClick={() => setEditing(emptyForm)} className="btn-primary">
            <Plus className="h-4 w-4" /> مشتری جدید
          </button>
        }
      />

      {isLoading ? (
        <p className="text-sm text-slate-500">در حال بارگذاری...</p>
      ) : clients.length === 0 ? (
        <EmptyState icon={Users2} title="هنوز مشتری‌ای ثبت نشده است." />
      ) : (
        <div className="card overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-start text-xs text-slate-500">
                <th className="px-4 py-3 text-start">نام</th>
                <th className="px-4 py-3 text-start">شرکت</th>
                <th className="px-4 py-3 text-start">وضعیت</th>
                <th className="px-4 py-3 text-start">پروژه فعال</th>
                <th className="px-4 py-3 text-start">تماس</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {clients.map((client) => (
                <tr key={client.id} className="border-b border-slate-100 last:border-0 hover:bg-slate-50/60">
                  <td className="px-4 py-3 font-medium text-slate-900">
                    <Link to={`/clients/${client.id}`} className="hover:text-brand-600 hover:underline">
                      {client.name}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-slate-600">{client.company_name || '—'}</td>
                  <td className="px-4 py-3">
                    <Badge
                      label={clientStatusLabels[client.status]}
                      className={
                        client.status === 'active'
                          ? 'bg-emerald-100 text-emerald-700'
                          : 'bg-slate-100 text-slate-600'
                      }
                    />
                  </td>
                  <td className="px-4 py-3 text-slate-600">{client.active_projects_count}</td>
                  <td className="px-4 py-3 text-slate-500">{client.phone || client.email || '—'}</td>
                  <td className="px-4 py-3 text-end">
                    <div className="flex justify-end gap-1">
                      <button
                        onClick={() => setEditing(client)}
                        className="rounded-md p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
                        title="ویرایش"
                      >
                        <Pencil className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => {
                          if (confirm('این مشتری حذف شود؟')) remove.mutate(client.id)
                        }}
                        className="rounded-md p-1.5 text-slate-400 hover:bg-rose-50 hover:text-rose-600"
                        title="حذف"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {editing && (
        <Modal title={editing.id ? 'ویرایش مشتری' : 'مشتری جدید'} onClose={() => setEditing(null)}>
          <form
            onSubmit={(e) => {
              e.preventDefault()
              save.mutate(editing)
            }}
            className="space-y-3"
          >
            <div>
              <label className="field-label">نام *</label>
              <input
                required
                value={editing.name ?? ''}
                onChange={(e) => setEditing({ ...editing, name: e.target.value })}
                className="field-input"
              />
            </div>
            <div>
              <label className="field-label">نام شرکت</label>
              <input
                value={editing.company_name ?? ''}
                onChange={(e) => setEditing({ ...editing, company_name: e.target.value })}
                className="field-input"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="field-label">تلفن</label>
                <input
                  value={editing.phone ?? ''}
                  onChange={(e) => setEditing({ ...editing, phone: e.target.value })}
                  className="field-input"
                />
              </div>
              <div>
                <label className="field-label">ایمیل</label>
                <input
                  value={editing.email ?? ''}
                  onChange={(e) => setEditing({ ...editing, email: e.target.value })}
                  className="field-input"
                />
              </div>
            </div>
            <div>
              <label className="field-label">وب‌سایت</label>
              <input
                value={editing.website ?? ''}
                onChange={(e) => setEditing({ ...editing, website: e.target.value })}
                className="field-input"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="field-label">حوزه فعالیت</label>
                <input
                  value={editing.industry ?? ''}
                  onChange={(e) => setEditing({ ...editing, industry: e.target.value })}
                  className="field-input"
                />
              </div>
              <div>
                <label className="field-label">وضعیت</label>
                <select
                  value={editing.status ?? 'active'}
                  onChange={(e) => setEditing({ ...editing, status: e.target.value as ClientStatus })}
                  className="field-input"
                >
                  {Object.entries(clientStatusLabels).map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div>
              <label className="field-label">یادداشت</label>
              <textarea
                value={editing.notes ?? ''}
                onChange={(e) => setEditing({ ...editing, notes: e.target.value })}
                className="field-input"
                rows={3}
              />
            </div>
            <button type="submit" disabled={save.isPending} className="btn-primary w-full">
              ذخیره
            </button>
          </form>
        </Modal>
      )}
    </div>
  )
}
