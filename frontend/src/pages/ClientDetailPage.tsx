import { useQuery } from '@tanstack/react-query'
import { Link, useParams } from 'react-router-dom'
import { Badge } from '../components/Badge'
import { PageHeader } from '../components/Layout'
import { api } from '../lib/api'
import { clientStatusLabels, priorityColors, priorityLabels, projectStatusLabels } from '../lib/labels'
import { formatToman } from '../lib/format'
import type { Client, Paginated, Project } from '../types'

export function ClientDetailPage() {
  const { id } = useParams()

  const { data: client } = useQuery<Client>({
    queryKey: ['clients', id],
    queryFn: async () => (await api.get(`/clients/${id}/`)).data,
  })

  const { data: projects } = useQuery<Paginated<Project>>({
    queryKey: ['projects', { client: id }],
    queryFn: async () => (await api.get('/projects/', { params: { client: id } })).data,
    enabled: !!id,
  })

  if (!client) return <p className="text-sm text-slate-500">در حال بارگذاری...</p>

  return (
    <div>
      <PageHeader title={client.company_name || client.name} />

      <div className="mb-6 grid grid-cols-1 gap-4 rounded-xl border border-slate-200 bg-white p-5 shadow-sm sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <div className="text-xs text-slate-400">وضعیت</div>
          <Badge label={clientStatusLabels[client.status]} />
        </div>
        <div>
          <div className="text-xs text-slate-400">تماس</div>
          <div className="text-sm text-slate-700">{client.phone || client.email || '—'}</div>
        </div>
        <div>
          <div className="text-xs text-slate-400">وب‌سایت</div>
          <div className="text-sm text-slate-700">{client.website || '—'}</div>
        </div>
        <div>
          <div className="text-xs text-slate-400">حوزه فعالیت</div>
          <div className="text-sm text-slate-700">{client.industry || '—'}</div>
        </div>
        {client.notes && (
          <div className="sm:col-span-2 lg:col-span-4">
            <div className="text-xs text-slate-400">یادداشت</div>
            <div className="text-sm text-slate-700">{client.notes}</div>
          </div>
        )}
      </div>

      <h2 className="mb-3 text-sm font-semibold text-slate-700">پروژه‌ها</h2>
      {!projects || projects.results.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-300 bg-white p-8 text-center text-sm text-slate-400">
          پروژه‌ای برای این مشتری ثبت نشده است.
        </div>
      ) : (
        <ul className="space-y-2">
          {projects.results.map((project) => (
            <li
              key={project.id}
              className="flex items-center justify-between rounded-xl border border-slate-200 bg-white p-4 shadow-sm"
            >
              <div>
                <Link to={`/projects/${project.id}`} className="font-medium text-slate-900 hover:underline">
                  {project.name}
                </Link>
                <div className="mt-1 flex gap-2 text-xs text-slate-500">
                  <Badge
                    label={priorityLabels[project.priority]}
                    className={priorityColors[project.priority]}
                  />
                  <Badge label={projectStatusLabels[project.status]} />
                </div>
              </div>
              <div className="ltr-nums text-sm font-medium text-slate-700">
                {formatToman(project.financials.revenue_amount)}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
