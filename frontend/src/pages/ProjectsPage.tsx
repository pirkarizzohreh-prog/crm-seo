import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Briefcase, Pencil, Plus } from 'lucide-react'
import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Badge } from '../components/Badge'
import { FormError } from '../components/FormError'
import { JalaliDateInput } from '../components/JalaliDateInput'
import { EmptyState, PageHeader } from '../components/Layout'
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
import { useMe } from '../lib/useMe'
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
  const { data: me } = useMe()
  const canEdit = me?.is_owner ?? false

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
          canEdit && (
            <button onClick={() => setEditing(emptyForm)} className="btn-primary">
              <Plus className="h-4 w-4" /> پروژه جدید
            </button>
          )
        }
      />

      <div className="mb-4 flex gap-2">
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="field-input w-auto"
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
        <EmptyState icon={Briefcase} title="پروژه‌ای یافت نشد." />
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {list.map((project) => (
            <div key={project.id} className="card p-4">
              <div className="mb-1 flex items-start justify-between">
                <Link to={`/projects/${project.id}`} className="font-medium text-slate-900 hover:text-brand-600 hover:underline">
                  {project.name}
                </Link>
                {canEdit && (
                  <button
                    onClick={() => setEditing(project)}
                    className="rounded-md p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
                    title="ویرایش"
                  >
                    <Pencil className="h-3.5 w-3.5" />
                  </button>
                )}
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
          error={save.error}
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
  error,
}: {
  editing: ProjectForm
  setEditing: (p: ProjectForm | null) => void
  clients: Client[]
  onSave: (p: ProjectForm) => void
  saving: boolean
  error: unknown
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
            <label className="field-label">نام پروژه *</label>
            <input
              required
              value={editing.name ?? ''}
              onChange={(e) => setEditing({ ...editing, name: e.target.value })}
              className="field-input"
            />
          </div>
          <div>
            <label className="field-label">مشتری *</label>
            <select
              required
              value={editing.client ?? ''}
              onChange={(e) => setEditing({ ...editing, client: Number(e.target.value) })}
              className="field-input"
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
            <label className="field-label">نوع پروژه</label>
            <select
              value={editing.project_type ?? 'seo_monthly'}
              onChange={(e) => setEditing({ ...editing, project_type: e.target.value as ProjectType })}
              className="field-input"
            >
              {Object.entries(projectTypeLabels).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="field-label">نوع قرارداد</label>
            <select
              value={editing.billing_type ?? 'retainer'}
              onChange={(e) => setEditing({ ...editing, billing_type: e.target.value as BillingType })}
              className="field-input"
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
            <label className="field-label">اولویت</label>
            <select
              value={editing.priority ?? 'medium'}
              onChange={(e) => setEditing({ ...editing, priority: e.target.value as Priority })}
              className="field-input"
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
            <label className="field-label">وضعیت</label>
            <select
              value={editing.status ?? 'planning'}
              onChange={(e) => setEditing({ ...editing, status: e.target.value as ProjectStatus })}
              className="field-input"
            >
              {Object.entries(projectStatusLabels).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="rounded-xl border border-brand-100 bg-brand-50/40 p-4">
          <div className="mb-2 text-xs font-semibold text-slate-500">اطلاعات مالی</div>
          <div className="grid grid-cols-2 gap-3">
            {!isHourly && (
              <div>
                <label className="field-label">
                  مبلغ قرارداد (تومان)
                </label>
                <input
                  type="number"
                  value={editing.budget ?? ''}
                  onChange={(e) => setEditing({ ...editing, budget: e.target.value })}
                  className="field-input ltr-nums"
                />
              </div>
            )}
            {isHourly && (
              <div>
                <label className="field-label">
                  هدف درآمد ماهانه (تومان)
                </label>
                <input
                  type="number"
                  value={editing.monthly_revenue_target ?? ''}
                  onChange={(e) => setEditing({ ...editing, monthly_revenue_target: e.target.value })}
                  className="field-input ltr-nums"
                />
              </div>
            )}
            <div>
              <label className="field-label">
                نرخ ساعتی هدف (تومان)
              </label>
              <input
                type="number"
                value={editing.hourly_rate ?? ''}
                onChange={(e) => setEditing({ ...editing, hourly_rate: e.target.value })}
                className="field-input ltr-nums"
              />
            </div>
            <div>
              <label className="field-label">
                ساعت واقعی موردنیاز در ماه
              </label>
              <input
                type="number"
                value={editing.estimated_monthly_hours ?? ''}
                onChange={(e) => setEditing({ ...editing, estimated_monthly_hours: e.target.value })}
                className="field-input ltr-nums"
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
            <label className="field-label">تاریخ شروع</label>
            <JalaliDateInput
              value={editing.start_date}
              onChange={(iso) => setEditing({ ...editing, start_date: iso || null })}
            />
          </div>
          <div>
            <label className="field-label">وب‌سایت</label>
            <input
              value={editing.website ?? ''}
              onChange={(e) => setEditing({ ...editing, website: e.target.value })}
              className="field-input"
            />
          </div>
        </div>

        <div>
          <label className="field-label">توضیحات</label>
          <textarea
            value={editing.description ?? ''}
            onChange={(e) => setEditing({ ...editing, description: e.target.value })}
            className="field-input"
            rows={2}
          />
        </div>

        <FormError error={error} />
        <button type="submit" disabled={saving} className="btn-primary w-full">
          ذخیره
        </button>
      </form>
    </Modal>
  )
}
