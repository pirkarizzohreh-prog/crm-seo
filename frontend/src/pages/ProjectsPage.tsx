import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Badge } from '../components/Badge'
import { PageHeader } from '../components/Layout'
import { Modal } from '../components/Modal'
import { api } from '../lib/api'
import { formatHours, formatToman } from '../lib/format'
import {
  billingTypeLabels,
  priorityColors,
  priorityLabels,
  profitabilityColors,
  profitabilityLabels,
  projectStatusLabels,
  projectTypeLabels,
} from '../lib/labels'
import type { BillingType, Client, Paginated, Priority, Project, ProjectStatus, ProjectType } from '../types'

type ProjectForm = Partial<Project>

const emptyForm: ProjectForm = {
  name: '',
  billing_type: 'retainer',
  project_type: 'seo_monthly',
  status: 'planning',
  priority: 'medium',
}

export function ProjectsPage() {
  const queryClient = useQueryClient()
  const [editing, setEditing] = useState<ProjectForm | null>(null)
  const [statusFilter, setStatusFilter] = useState<string>('')

  const { data: clients } = useQuery<Paginated<Client>>({
    queryKey: ['clients'],
    queryFn: async () => (await api.get('/clients/')).data,
  })

  const { data: projects, isLoading } = useQuery<Paginated<Project>>({
    queryKey: ['projects', { status: statusFilter }],
    queryFn: async () =>
      (await api.get('/projects/', { params: statusFilter ? { status: statusFilter } : {} })).data,
  })

  const save = useMutation({
    mutationFn: (project: ProjectForm) =>
      project.id ? api.patch(`/projects/${project.id}/`, project) : api.post('/projects/', project),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] })
      setEditing(null)
    },
  })

  const list = projects?.results ?? []

  return (
    <div>
      <PageHeader
        title="پروژه‌ها"
        actions={
          <button
            onClick={() => setEditing(emptyForm)}
            className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800"
          >
            + پروژه جدید
          </button>
        }
      />

      <div className="mb-4 flex gap-2">
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm"
        >
          <option value="">همه وضعیت‌ها</option>
          {Object.entries(projectStatusLabels).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
      </div>

      {isLoading ? (
        <p className="text-sm text-slate-500">در حال بارگذاری...</p>
      ) : list.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-300 bg-white p-8 text-center text-sm text-slate-400">
          پروژه‌ای یافت نشد.
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {list.map((project) => (
            <div
              key={project.id}
              className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm"
            >
              <div className="mb-1 flex items-start justify-between">
                <Link to={`/projects/${project.id}`} className="font-medium text-slate-900 hover:underline">
                  {project.name}
                </Link>
                <button
                  onClick={() => setEditing(project)}
                  className="text-xs text-slate-400 hover:text-slate-700"
                >
                  ویرایش
                </button>
              </div>
              <div className="mb-2 text-xs text-slate-500">{project.client_name}</div>
              <div className="mb-3 flex flex-wrap gap-1.5">
                <Badge label={priorityLabels[project.priority]} className={priorityColors[project.priority]} />
                <Badge label={projectStatusLabels[project.status]} />
                <Badge label={billingTypeLabels[project.billing_type]} className="bg-slate-100 text-slate-600" />
              </div>
              <div className="flex items-center justify-between border-t border-slate-100 pt-3 text-sm">
                <span className="font-semibold text-slate-900">
                  {formatToman(project.financials.revenue_amount)}
                </span>
                <Badge
                  label={profitabilityLabels[project.financials.profitability_status]}
                  className={profitabilityColors[project.financials.profitability_status]}
                />
              </div>
              {project.financials.capacity_hours && (
                <div className="mt-1 text-xs text-slate-400">
                  {formatHours(project.financials.logged_hours)} از{' '}
                  {formatHours(project.financials.capacity_hours)} ظرفیت این ماه
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {editing && (
        <ProjectFormModal
          editing={editing}
          setEditing={setEditing}
          clients={clients?.results ?? []}
          onSave={(p) => save.mutate(p)}
          saving={save.isPending}
        />
      )}
    </div>
  )
}

function ProjectFormModal({
  editing,
  setEditing,
  clients,
  onSave,
  saving,
}: {
  editing: ProjectForm
  setEditing: (p: ProjectForm | null) => void
  clients: Client[]
  onSave: (p: ProjectForm) => void
  saving: boolean
}) {
  const isHourly = editing.billing_type === 'hourly'

  return (
    <Modal title={editing.id ? 'ویرایش پروژه' : 'پروژه جدید'} onClose={() => setEditing(null)} wide>
      <form
        onSubmit={(e) => {
          e.preventDefault()
          onSave(editing)
        }}
        className="space-y-3"
      >
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">نام پروژه *</label>
            <input
              required
              value={editing.name ?? ''}
              onChange={(e) => setEditing({ ...editing, name: e.target.value })}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">مشتری *</label>
            <select
              required
              value={editing.client ?? ''}
              onChange={(e) => setEditing({ ...editing, client: Number(e.target.value) })}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
            >
              <option value="" disabled>
                انتخاب کنید
              </option>
              {clients.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">نوع پروژه</label>
            <select
              value={editing.project_type ?? 'seo_monthly'}
              onChange={(e) => setEditing({ ...editing, project_type: e.target.value as ProjectType })}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
            >
              {Object.entries(projectTypeLabels).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">نوع قرارداد</label>
            <select
              value={editing.billing_type ?? 'retainer'}
              onChange={(e) => setEditing({ ...editing, billing_type: e.target.value as BillingType })}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
            >
              {Object.entries(billingTypeLabels).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">اولویت</label>
            <select
              value={editing.priority ?? 'medium'}
              onChange={(e) => setEditing({ ...editing, priority: e.target.value as Priority })}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
            >
              {Object.entries(priorityLabels)
                .filter(([value]) => ['low', 'medium', 'high', 'critical'].includes(value))
                .map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">وضعیت</label>
            <select
              value={editing.status ?? 'planning'}
              onChange={(e) => setEditing({ ...editing, status: e.target.value as ProjectStatus })}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
            >
              {Object.entries(projectStatusLabels).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="rounded-lg bg-slate-50 p-3">
          <div className="mb-2 text-xs font-semibold text-slate-500">اطلاعات مالی</div>
          <div className="grid grid-cols-2 gap-3">
            {!isHourly && (
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">
                  مبلغ قرارداد (تومان)
                </label>
                <input
                  type="number"
                  value={editing.budget ?? ''}
                  onChange={(e) => setEditing({ ...editing, budget: e.target.value })}
                  className="ltr-nums w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                />
              </div>
            )}
            {isHourly && (
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">
                  هدف درآمد ماهانه (تومان)
                </label>
                <input
                  type="number"
                  value={editing.monthly_revenue_target ?? ''}
                  onChange={(e) => setEditing({ ...editing, monthly_revenue_target: e.target.value })}
                  className="ltr-nums w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                />
              </div>
            )}
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">
                نرخ ساعتی هدف (تومان)
              </label>
              <input
                type="number"
                value={editing.hourly_rate ?? ''}
                onChange={(e) => setEditing({ ...editing, hourly_rate: e.target.value })}
                className="ltr-nums w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">
                ساعت واقعی موردنیاز در ماه
              </label>
              <input
                type="number"
                value={editing.estimated_monthly_hours ?? ''}
                onChange={(e) => setEditing({ ...editing, estimated_monthly_hours: e.target.value })}
                className="ltr-nums w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
              />
            </div>
          </div>
          <p className="mt-2 text-xs text-slate-400">
            سیستم با مقایسه‌ی «ساعتی که مبلغ قرارداد می‌خرد» و «ساعتی که واقعاً لازم است»، وضعیت
            سودآوری پروژه را محاسبه می‌کند.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">تاریخ شروع</label>
            <input
              type="date"
              value={editing.start_date ?? ''}
              onChange={(e) => setEditing({ ...editing, start_date: e.target.value })}
              className="ltr-nums w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">وب‌سایت</label>
            <input
              value={editing.website ?? ''}
              onChange={(e) => setEditing({ ...editing, website: e.target.value })}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
            />
          </div>
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">توضیحات</label>
          <textarea
            value={editing.description ?? ''}
            onChange={(e) => setEditing({ ...editing, description: e.target.value })}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
            rows={2}
          />
        </div>

        <button
          type="submit"
          disabled={saving}
          className="w-full rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-50"
        >
          ذخیره
        </button>
      </form>
    </Modal>
  )
}
