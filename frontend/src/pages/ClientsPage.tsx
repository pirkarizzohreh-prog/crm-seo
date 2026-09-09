import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Badge } from '../components/Badge'
import { PageHeader } from '../components/Layout'
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
          <button
            onClick={() => setEditing(emptyForm)}
            className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800"
          >
            + مشتری جدید
          </button>
        }
      />

      {isLoading ? (
        <p className="text-sm text-slate-500">در حال بارگذاری...</p>
      ) : clients.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-300 bg-white p-8 text-center text-sm text-slate-400">
          هنوز مشتری‌ای ثبت نشده است.
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
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
                <tr key={client.id} className="border-b border-slate-100 last:border-0">
                  <td className="px-4 py-3 font-medium text-slate-900">
                    <Link to={`/clients/${client.id}`} className="hover:underline">
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
                  <td className="ltr-nums px-4 py-3 text-slate-600">
                    {client.active_projects_count}
                  </td>
                  <td className="px-4 py-3 text-slate-500">{client.phone || client.email || '—'}</td>
                  <td className="px-4 py-3 text-end">
                    <button
                      onClick={() => setEditing(client)}
                      className="ms-2 text-xs text-slate-500 hover:text-slate-900"
                    >
                      ویرایش
                    </button>
                    <button
                      onClick={() => {
                        if (confirm('این مشتری حذف شود؟')) remove.mutate(client.id)
                      }}
                      className="ms-3 text-xs text-rose-500 hover:text-rose-700"
                    >
                      حذف
                    </button>
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
              <label className="mb-1 block text-sm font-medium text-slate-700">نام *</label>
              <input
                required
                value={editing.name ?? ''}
                onChange={(e) => setEditing({ ...editing, name: e.target.value })}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">نام شرکت</label>
              <input
                value={editing.company_name ?? ''}
                onChange={(e) => setEditing({ ...editing, company_name: e.target.value })}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">تلفن</label>
                <input
                  value={editing.phone ?? ''}
                  onChange={(e) => setEditing({ ...editing, phone: e.target.value })}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">ایمیل</label>
                <input
                  value={editing.email ?? ''}
                  onChange={(e) => setEditing({ ...editing, email: e.target.value })}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                />
              </div>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">وب‌سایت</label>
              <input
                value={editing.website ?? ''}
                onChange={(e) => setEditing({ ...editing, website: e.target.value })}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">حوزه فعالیت</label>
                <input
                  value={editing.industry ?? ''}
                  onChange={(e) => setEditing({ ...editing, industry: e.target.value })}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">وضعیت</label>
                <select
                  value={editing.status ?? 'active'}
                  onChange={(e) =>
                    setEditing({ ...editing, status: e.target.value as ClientStatus })
                  }
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
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
              <label className="mb-1 block text-sm font-medium text-slate-700">یادداشت</label>
              <textarea
                value={editing.notes ?? ''}
                onChange={(e) => setEditing({ ...editing, notes: e.target.value })}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                rows={3}
              />
            </div>
            <button
              type="submit"
              disabled={save.isPending}
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
