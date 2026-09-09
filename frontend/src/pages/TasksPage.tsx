import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Badge } from '../components/Badge'
import { PageHeader } from '../components/Layout'
import { api } from '../lib/api'
import { formatHours } from '../lib/format'
import { priorityColors, priorityLabels, taskStatusColors, taskStatusLabels } from '../lib/labels'
import type { Paginated, Task, TaskStatus } from '../types'

export function TasksPage() {
  const queryClient = useQueryClient()
  const [status, setStatus] = useState('')

  const { data, isLoading } = useQuery<Paginated<Task>>({
    queryKey: ['tasks', { status }],
    queryFn: async () =>
      (await api.get('/tasks/', { params: status ? { status } : {} })).data,
  })

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ['tasks'] })
    queryClient.invalidateQueries({ queryKey: ['dashboard'] })
    queryClient.invalidateQueries({ queryKey: ['timer'] })
  }

  const setTaskStatus = useMutation({
    mutationFn: ({ id, status: s }: { id: number; status: TaskStatus }) =>
      api.patch(`/tasks/${id}/`, { status: s }),
    onSuccess: invalidate,
  })

  const startTimer = useMutation({
    mutationFn: (taskId: number) => api.post('/time/timer/', { task: taskId }),
    onSuccess: invalidate,
  })

  const tasks = data?.results ?? []

  return (
    <div>
      <PageHeader title="همه تسک‌ها" />

      <div className="mb-4 flex gap-2">
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm"
        >
          <option value="">همه وضعیت‌ها</option>
          {Object.entries(taskStatusLabels).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
      </div>

      {isLoading ? (
        <p className="text-sm text-slate-500">در حال بارگذاری...</p>
      ) : tasks.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-300 bg-white p-8 text-center text-sm text-slate-400">
          تسکی یافت نشد.
        </div>
      ) : (
        <ul className="space-y-2">
          {tasks.map((task) => (
            <li
              key={task.id}
              className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm"
            >
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-medium text-slate-900">{task.title}</span>
                  <Badge label={priorityLabels[task.priority]} className={priorityColors[task.priority]} />
                </div>
                <div className="mt-1 text-xs text-slate-500">
                  <Link to={`/projects/${task.project}`} className="hover:underline">
                    {task.project_name}
                  </Link>
                  {' · '}
                  <span>
                    {formatHours(task.actual_hours)} از {formatHours(task.estimated_hours)}
                  </span>
                  {task.deadline && <span> · موعد: {task.deadline}</span>}
                </div>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                <button
                  onClick={() => startTimer.mutate(task.id)}
                  className="rounded-md border border-slate-200 px-2 py-1 text-xs font-medium text-slate-600 hover:bg-slate-50"
                >
                  شروع تایمر
                </button>
                <select
                  value={task.status}
                  onChange={(e) => setTaskStatus.mutate({ id: task.id, status: e.target.value as TaskStatus })}
                  className={`rounded-md border-0 px-2 py-1 text-xs font-medium ${taskStatusColors[task.status]}`}
                >
                  {Object.entries(taskStatusLabels).map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </select>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
