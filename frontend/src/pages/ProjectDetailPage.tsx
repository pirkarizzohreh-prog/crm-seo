import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { useParams } from 'react-router-dom'
import { Badge } from '../components/Badge'
import { PageHeader } from '../components/Layout'
import { Modal } from '../components/Modal'
import { StatCard } from '../components/StatCard'
import { api } from '../lib/api'
import { formatHours, formatToman } from '../lib/format'
import {
  priorityColors,
  priorityLabels,
  profitabilityColors,
  profitabilityLabels,
  taskStatusColors,
  taskStatusLabels,
} from '../lib/labels'
import type { Paginated, Project, Task, TaskCategory, TaskPriority, TaskStatus } from '../types'

type TaskForm = Partial<Task>

const emptyTaskForm: TaskForm = { title: '', priority: 'medium', status: 'todo' }

export function ProjectDetailPage() {
  const { id } = useParams()
  const queryClient = useQueryClient()
  const [editingTask, setEditingTask] = useState<TaskForm | null>(null)

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

  if (!project) return <p className="text-sm text-slate-500">در حال بارگذاری...</p>

  const f = project.financials
  const taskList = tasks?.results ?? []

  return (
    <div>
      <PageHeader
        title={project.name}
        actions={
          <button
            onClick={() => setEditingTask(emptyTaskForm)}
            className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800"
          >
            + تسک جدید
          </button>
        }
      />
      <div className="mb-6 text-sm text-slate-500">{project.client_name}</div>

      <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard title="درآمد ماهانه" value={formatToman(f.revenue_amount)} />
        <StatCard
          title="ساعت خریداری‌شده توسط قرارداد"
          value={formatHours(f.capacity_hours)}
          subtitle={
            f.variance_hours !== null
              ? Number(f.variance_hours) >= 0
                ? `${formatHours(f.variance_hours)} حاشیه`
                : `${formatHours(Math.abs(Number(f.variance_hours)))} کسری`
              : undefined
          }
          tone={f.variance_hours !== null && Number(f.variance_hours) < 0 ? 'danger' : 'default'}
        />
        <StatCard title="ساعت ثبت‌شده این ماه" value={formatHours(f.logged_hours)} />
        <StatCard
          title="وضعیت سودآوری"
          value={<Badge label={profitabilityLabels[f.profitability_status]} className={profitabilityColors[f.profitability_status]} />}
          subtitle={f.effective_hourly_rate ? `نرخ واقعی: ${formatToman(f.effective_hourly_rate)}/ساعت` : undefined}
        />
      </div>

      <h2 className="mb-3 text-sm font-semibold text-slate-700">تسک‌ها ({taskList.length})</h2>
      {taskList.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-300 bg-white p-8 text-center text-sm text-slate-400">
          هنوز تسکی برای این پروژه ثبت نشده است.
        </div>
      ) : (
        <ul className="space-y-2">
          {taskList.map((task) => (
            <li
              key={task.id}
              className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm"
            >
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-medium text-slate-900">{task.title}</span>
                  <Badge label={priorityLabels[task.priority]} className={priorityColors[task.priority]} />
                  {task.category_name && (
                    <Badge label={task.category_name} className="bg-slate-100 text-slate-600" />
                  )}
                </div>
                <div className="mt-1 text-xs text-slate-500">
                  {formatHours(task.actual_hours)} از {formatHours(task.estimated_hours)} تخمینی
                  {task.deadline && ` · موعد: ${task.deadline}`}
                </div>
              </div>
              <div className="flex shrink-0 items-center gap-2">
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
                  className="text-xs text-slate-400 hover:text-slate-700"
                >
                  ویرایش
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}

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
              <label className="mb-1 block text-sm font-medium text-slate-700">عنوان *</label>
              <input
                required
                value={editingTask.title ?? ''}
                onChange={(e) => setEditingTask({ ...editingTask, title: e.target.value })}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">دسته‌بندی</label>
                <select
                  value={editingTask.category ?? ''}
                  onChange={(e) =>
                    setEditingTask({
                      ...editingTask,
                      category: e.target.value ? Number(e.target.value) : null,
                    })
                  }
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
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
                <label className="mb-1 block text-sm font-medium text-slate-700">اولویت</label>
                <select
                  value={editingTask.priority ?? 'medium'}
                  onChange={(e) => setEditingTask({ ...editingTask, priority: e.target.value as TaskPriority })}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
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
                <label className="mb-1 block text-sm font-medium text-slate-700">ساعت تخمینی</label>
                <input
                  type="number"
                  step="0.5"
                  value={editingTask.estimated_hours ?? ''}
                  onChange={(e) => setEditingTask({ ...editingTask, estimated_hours: e.target.value })}
                  className="ltr-nums w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">موعد انجام</label>
                <input
                  type="date"
                  value={editingTask.deadline ?? ''}
                  onChange={(e) => setEditingTask({ ...editingTask, deadline: e.target.value })}
                  className="ltr-nums w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                />
              </div>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">توضیحات</label>
              <textarea
                value={editingTask.description ?? ''}
                onChange={(e) => setEditingTask({ ...editingTask, description: e.target.value })}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                rows={2}
              />
            </div>
            <button
              type="submit"
              disabled={saveTask.isPending}
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
