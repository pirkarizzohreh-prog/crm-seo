import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { ClipboardList, Coins, Gauge, LayoutTemplate, Pencil, Play, Plus, TrendingUp } from 'lucide-react'
import { useState } from 'react'
import { useParams } from 'react-router-dom'
import { Badge } from '../components/Badge'
import { FormError } from '../components/FormError'
import { JalaliDateInput } from '../components/JalaliDateInput'
import { KeywordsPanel } from '../components/KeywordsPanel'
import { EmptyState, PageHeader } from '../components/Layout'
import { Modal } from '../components/Modal'
import { MonthlyReportPanel } from '../components/MonthlyReportPanel'
import { SearchConsolePanel } from '../components/SearchConsolePanel'
import { StatCard } from '../components/StatCard'
import { Tabs } from '../components/Tabs'
import { api } from '../lib/api'
import { fasterThanEstimateLabel, formatDate, formatHours, formatToman } from '../lib/format'
import {
  priorityColors,
  priorityLabels,
  profitabilityColors,
  profitabilityLabels,
  taskStatusColors,
  taskStatusLabels,
} from '../lib/labels'
import type { Paginated, Project, Task, TaskCategory, TaskPriority, TaskStatus, TaskTemplate } from '../types'

type TaskForm = Partial<Task>

const emptyTaskForm: TaskForm = { title: '', priority: 'medium', status: 'todo' }

export function ProjectDetailPage() {
  const { id } = useParams()
  const queryClient = useQueryClient()
  const [editingTask, setEditingTask] = useState<TaskForm | null>(null)
  const [tab, setTab] = useState<'tasks' | 'keywords' | 'report' | 'search-console'>('tasks')
  const [applyingTemplate, setApplyingTemplate] = useState(false)
  const [templateStartDate, setTemplateStartDate] = useState('')
  const [templateHoursPerDay, setTemplateHoursPerDay] = useState('3')

  const { data: project } = useQuery<Project>({
    queryKey: ['projects', id],
    queryFn: async () => (await api.get(`/projects/${id}/`)).data,
  })

  const { data: tasks } = useQuery<Paginated<Task>>({
    queryKey: ['tasks', { project: id }],
    queryFn: async () => (await api.get('/tasks/', { params: { project: id } })).data,
    enabled: !!id,
  })

  const { data: categories } = useQuery<Paginated<TaskCategory>>({
    queryKey: ['task-categories'],
    queryFn: async () => (await api.get('/tasks/categories/')).data,
  })

  const invalidateTasks = () => queryClient.invalidateQueries({ queryKey: ['tasks'] })

  const saveTask = useMutation({
    mutationFn: (task: TaskForm) => {
      const payload = { ...task, project: Number(id) }
      return task.id ? api.patch(`/tasks/${task.id}/`, payload) : api.post('/tasks/', payload)
    },
    onSuccess: () => {
      invalidateTasks()
      setEditingTask(null)
    },
  })

  const setStatus = useMutation({
    mutationFn: ({ taskId, status }: { taskId: number; status: TaskStatus }) =>
      api.patch(`/tasks/${taskId}/`, { status }),
    onSuccess: invalidateTasks,
  })

  const startTimer = useMutation({
    mutationFn: (taskId: number) => api.post('/time/timer/', { task: taskId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['timer'] })
      invalidateTasks()
    },
  })

  const { data: templates } = useQuery<Paginated<TaskTemplate>>({
    queryKey: ['task-templates'],
    queryFn: async () => (await api.get('/tasks/templates/')).data,
    enabled: applyingTemplate,
  })

  const applyTemplate = useMutation({
    mutationFn: (templateId: number) =>
      api.post(`/projects/${id}/apply-template/`, {
        template_id: templateId,
        // Optional — when set, the backend spreads a real deadline across
        // each task (working days, Fridays skipped) instead of leaving
        // them all with no due date.
        ...(templateStartDate && templateHoursPerDay
          ? { start_date: templateStartDate, hours_per_day: templateHoursPerDay }
          : {}),
      }),
    onSuccess: () => {
      invalidateTasks()
      setApplyingTemplate(false)
    },
  })

  if (!project) return <p className="text-sm text-slate-500">در حال بارگذاری...</p>

  const f = project.financials
  const taskList = tasks?.results ?? []

  return (
    <div>
      <PageHeader
        title={project.name}
        subtitle={project.client_name}
        actions={
          tab === 'tasks' && (
            <div className="flex gap-2">
              <button onClick={() => setApplyingTemplate(true)} className="btn-secondary">
                <LayoutTemplate className="h-4 w-4" /> اعمال قالب
              </button>
              <button onClick={() => setEditingTask(emptyTaskForm)} className="btn-primary">
                <Plus className="h-4 w-4" /> تسک جدید
              </button>
            </div>
          )
        }
      />

      <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard title="درآمد ماهانه" value={formatToman(f.revenue_amount)} icon={Coins} />
        <StatCard
          title="ساعت خریداری‌شده توسط قرارداد"
          value={formatHours(f.capacity_hours)}
          icon={TrendingUp}
          subtitle={
            f.variance_hours !== null
              ? Number(f.variance_hours) >= 0
                ? `${formatHours(f.variance_hours)} حاشیه`
                : `${formatHours(Math.abs(Number(f.variance_hours)))} کسری`
              : undefined
          }
          tone={f.variance_hours !== null && Number(f.variance_hours) < 0 ? 'danger' : 'default'}
        />
        <StatCard title="ساعت ثبت‌شده این ماه" value={formatHours(f.logged_hours)} icon={ClipboardList} />
        <StatCard
          title="درآمد بر اساس ساعت کاری"
          value={formatToman(f.earned_from_hours)}
          icon={Coins}
          subtitle={f.earned_from_hours ? `${formatHours(f.logged_hours)} × نرخ ساعتی هدف` : 'نرخ ساعتی هدف را در پروژه ثبت کنید'}
          tone="success"
        />
        <StatCard
          title="وضعیت سودآوری"
          icon={Gauge}
          value={
            <Badge
              label={profitabilityLabels[f.profitability_status]}
              className={profitabilityColors[f.profitability_status]}
            />
          }
          subtitle={f.effective_hourly_rate ? `نرخ واقعی: ${formatToman(f.effective_hourly_rate)}/ساعت` : undefined}
        />
      </div>

      <Tabs
        tabs={[
          { key: 'tasks', label: `تسک‌ها (${taskList.length})` },
          { key: 'keywords', label: 'کلمات کلیدی' },
          { key: 'report', label: 'گزارش ماهانه' },
          { key: 'search-console', label: 'سرچ کنسول' },
        ]}
        active={tab}
        onChange={(k) => setTab(k as typeof tab)}
      />

      {tab === 'tasks' && <FormError error={startTimer.error} />}

      {tab === 'tasks' &&
        (taskList.length === 0 ? (
          <EmptyState icon={ClipboardList} title="هنوز تسکی برای این پروژه ثبت نشده است." />
        ) : (
          <ul className="space-y-2">
            {taskList.map((task) => (
              <li key={task.id} className="card flex flex-wrap items-center justify-between gap-3 p-4">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-medium text-slate-900">{task.title}</span>
                    <Badge label={priorityLabels[task.priority]} className={priorityColors[task.priority]} />
                    {task.category_name && (
                      <Badge label={task.category_name} className="bg-slate-100 text-slate-600" />
                    )}
                    {task.status === 'done' &&
                      (() => {
                        const label = fasterThanEstimateLabel(task.actual_hours, task.estimated_hours)
                        return label && <Badge label={label} className="bg-emerald-100 text-emerald-700" />
                      })()}
                  </div>
                  <div className="mt-1 text-xs text-slate-500">
                    {formatHours(task.actual_hours)} از {formatHours(task.estimated_hours)} تخمینی
                    {task.deadline && ` · موعد: ${formatDate(task.deadline)}`}
                  </div>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <button
                    onClick={() => startTimer.mutate(task.id)}
                    disabled={startTimer.isPending}
                    className="rounded-md p-1.5 text-slate-400 hover:bg-emerald-50 hover:text-emerald-600"
                    title="شروع تایمر روی این تسک"
                  >
                    <Play className="h-4 w-4" />
                  </button>
                  <select
                    value={task.status}
                    onChange={(e) => setStatus.mutate({ taskId: task.id, status: e.target.value as TaskStatus })}
                    className={`rounded-md border-0 px-2 py-1 text-xs font-medium ${taskStatusColors[task.status]}`}
                  >
                    {Object.entries(taskStatusLabels).map(([value, label]) => (
                      <option key={value} value={value}>
                        {label}
                      </option>
                    ))}
                  </select>
                  <button
                    onClick={() => setEditingTask(task)}
                    className="rounded-md p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
                    title="ویرایش"
                  >
                    <Pencil className="h-4 w-4" />
                  </button>
                </div>
              </li>
            ))}
          </ul>
        ))}

      {tab === 'keywords' && <KeywordsPanel projectId={Number(id)} />}
      {tab === 'report' && <MonthlyReportPanel projectId={Number(id)} />}
      {tab === 'search-console' && <SearchConsolePanel project={project} />}

      {editingTask && (
        <Modal title={editingTask.id ? 'ویرایش تسک' : 'تسک جدید'} onClose={() => setEditingTask(null)}>
          <form
            onSubmit={(e) => {
              e.preventDefault()
              saveTask.mutate(editingTask)
            }}
            className="space-y-3"
          >
            <div>
              <label className="field-label">عنوان *</label>
              <input
                required
                value={editingTask.title ?? ''}
                onChange={(e) => setEditingTask({ ...editingTask, title: e.target.value })}
                className="field-input"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="field-label">دسته‌بندی</label>
                <select
                  value={editingTask.category ?? ''}
                  onChange={(e) =>
                    setEditingTask({
                      ...editingTask,
                      category: e.target.value ? Number(e.target.value) : null,
                    })
                  }
                  className="field-input"
                >
                  <option value="">بدون دسته</option>
                  {categories?.results.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="field-label">اولویت</label>
                <select
                  value={editingTask.priority ?? 'medium'}
                  onChange={(e) => setEditingTask({ ...editingTask, priority: e.target.value as TaskPriority })}
                  className="field-input"
                >
                  {Object.entries(priorityLabels)
                    .filter(([v]) => ['low', 'medium', 'high', 'urgent'].includes(v))
                    .map(([value, label]) => (
                      <option key={value} value={value}>
                        {label}
                      </option>
                    ))}
                </select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="field-label">ساعت تخمینی</label>
                <input
                  type="number"
                  step="0.5"
                  value={editingTask.estimated_hours ?? ''}
                  onChange={(e) => setEditingTask({ ...editingTask, estimated_hours: e.target.value })}
                  className="field-input ltr-nums"
                />
              </div>
              <div>
                <label className="field-label">موعد انجام</label>
                <JalaliDateInput
                  value={editingTask.deadline}
                  onChange={(iso) => setEditingTask({ ...editingTask, deadline: iso || null })}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="field-label">تکرار</label>
                <select
                  value={editingTask.recurrence ?? 'none'}
                  onChange={(e) =>
                    setEditingTask({ ...editingTask, recurrence: e.target.value as Task['recurrence'] })
                  }
                  className="field-input"
                >
                  <option value="none">بدون تکرار</option>
                  <option value="weekly">هفتگی</option>
                  <option value="monthly">ماهانه</option>
                </select>
              </div>
              <div>
                <label className="field-label">ارزش تولیدشده (تومان)</label>
                <input
                  type="number"
                  value={editingTask.value_generated ?? ''}
                  onChange={(e) => setEditingTask({ ...editingTask, value_generated: e.target.value })}
                  className="field-input ltr-nums"
                />
              </div>
            </div>
            <div>
              <label className="field-label">توضیحات</label>
              <textarea
                value={editingTask.description ?? ''}
                onChange={(e) => setEditingTask({ ...editingTask, description: e.target.value })}
                className="field-input"
                rows={2}
              />
            </div>
            <FormError error={saveTask.error} />
            <button type="submit" disabled={saveTask.isPending} className="btn-primary w-full">
              ذخیره
            </button>
          </form>
        </Modal>
      )}

      {applyingTemplate && (
        <Modal title="اعمال قالب تسک" onClose={() => setApplyingTemplate(false)}>
          {!templates || templates.results.length === 0 ? (
            <p className="text-sm text-slate-500">
              هنوز قالبی نساخته‌اید. از صفحه‌ی «قالب‌های تسک» یکی بسازید.
            </p>
          ) : (
            <>
              <div className="mb-4 rounded-lg border border-slate-200 bg-slate-50 p-3">
                <p className="mb-2 text-xs text-slate-500">
                  اختیاری — اگه پر کنید، برای هر تسک یک موعد واقعی محاسبه و ثبت می‌شود (روزهای کاری،
                  بدون جمعه) تا در تقویم و داشبورد دیده شوند.
                </p>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="field-label">تاریخ شروع</label>
                    <JalaliDateInput value={templateStartDate} onChange={setTemplateStartDate} />
                  </div>
                  <div>
                    <label className="field-label">ساعت کاری در روز برای این پروژه</label>
                    <input
                      type="number"
                      step="0.5"
                      min="0.5"
                      value={templateHoursPerDay}
                      onChange={(e) => setTemplateHoursPerDay(e.target.value)}
                      className="field-input ltr-nums"
                    />
                  </div>
                </div>
              </div>
              <FormError error={applyTemplate.error} />
              <ul className="space-y-2">
                {templates.results.map((tpl) => (
                  <li
                    key={tpl.id}
                    className="flex items-center justify-between rounded-lg border border-slate-200 p-3"
                  >
                    <div>
                      <div className="text-sm font-medium text-slate-900">{tpl.name}</div>
                      <div className="text-xs text-slate-500">{tpl.items.length} تسک</div>
                    </div>
                    <button
                      onClick={() => applyTemplate.mutate(tpl.id)}
                      disabled={applyTemplate.isPending}
                      className="btn-secondary !px-3 !py-1.5 text-xs"
                    >
                      اعمال
                    </button>
                  </li>
                ))}
              </ul>
            </>
          )}
        </Modal>
      )}
    </div>
  )
}
