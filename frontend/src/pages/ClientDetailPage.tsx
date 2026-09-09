import { useQuery } from '@tanstack/react-query'
import { Briefcase, Globe, Phone, Tag } from 'lucide-react'
import { Link, useParams } from 'react-router-dom'
import { Badge } from '../components/Badge'
import { EmptyState, PageHeader } from '../components/Layout'
import { api } from '../lib/api'
import { formatToman } from '../lib/format'
import { clientStatusLabels, priorityColors, priorityLabels, projectStatusLabels } from '../lib/labels'
import type { Client, Paginated, Project } from '../types'

function InfoItem({ icon: Icon, label, value }: { icon: typeof Phone; label: string; value: string }) {
  return (
    <div>
      <div className="mb-1 flex items-center gap-1.5 text-xs text-slate-400">
        <Icon className="h-3.5 w-3.5" strokeWidth={1.75} />
        {label}
      </div>
      <div className="text-sm text-slate-700">{value || '—'}</div>
    </div>
  )
}

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
      <PageHeader
        title={client.company_name || client.name}
        actions={<Badge label={clientStatusLabels[client.status]} />}
      />

      <div className="card mb-6 grid grid-cols-1 gap-5 p-5 sm:grid-cols-2 lg:grid-cols-4">
        <InfoItem icon={Phone} label="تماس" value={client.phone || client.email} />
        <InfoItem icon={Globe} label="وب‌سایت" value={client.website} />
        <InfoItem icon={Tag} label="حوزه فعالیت" value={client.industry} />
        <InfoItem icon={Briefcase} label="پروژه فعال" value={String(client.active_projects_count)} />
        {client.notes && (
          <div className="sm:col-span-2 lg:col-span-4">
            <div className="mb-1 text-xs text-slate-400">یادداشت</div>
            <div className="text-sm text-slate-700">{client.notes}</div>
          </div>
        )}
      </div>

      <h2 className="mb-3 text-sm font-semibold text-slate-700">پروژه‌ها</h2>
      {!projects || projects.results.length === 0 ? (
        <EmptyState icon={Briefcase} title="پروژه‌ای برای این مشتری ثبت نشده است." />
      ) : (
        <ul className="space-y-2">
          {projects.results.map((project) => (
            <li key={project.id} className="card flex items-center justify-between p-4">
              <div>
                <Link to={`/projects/${project.id}`} className="font-medium text-slate-900 hover:text-brand-600 hover:underline">
                  {project.name}
                </Link>
                <div className="mt-1 flex gap-2 text-xs text-slate-500">
                  <Badge label={priorityLabels[project.priority]} className={priorityColors[project.priority]} />
                  <Badge label={projectStatusLabels[project.status]} />
                </div>
              </div>
              <div className="text-sm font-medium text-slate-700">
                {formatToman(project.financials.revenue_amount)}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
