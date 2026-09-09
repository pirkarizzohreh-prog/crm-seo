import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { Badge } from '../components/Badge'
import { PageHeader } from '../components/Layout'
import { StatCard } from '../components/StatCard'
import { api } from '../lib/api'
import { formatHours, formatToman } from '../lib/format'
import { priorityColors, priorityLabels, taskStatusColors, taskStatusLabels } from '../lib/labels'
import type { DashboardData, Task } from '../types'

export function DashboardPage() {
  const queryClient = useQueryClient()

  const { data, isLoading } = useQuery<DashboardData>({
    queryKey: ['dashboard'],
    queryFn: async () => (await api.get('/dashboard/')).data,
  })

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ['dashboard'] })
    queryClient.invalidateQueries({ queryKey: ['timer'] })
    queryClient.invalidateQueries({ queryKey: ['tasks'] })
  }

  const startTimer = useMutation({
    mutationFn: (taskId: number) => api.post('/time/timer/', { task: taskId }),
    onSuccess: invalidate,
  })

  const setStatus = useMutation({
    mutationFn: ({ id, status }: { id: number; status: string }) =>
      api.patch(`/tasks/${id}/`, { status }),
    onSuccess: invalidate,
  })

  if (isLoading || !data) {
    return <p className="text-sm text-slate-500">در حال بارگذاری...</p>
  }

  const { capacity, revenue, project_health: projectHealth, today_tasks: todayTasks } = data

  return (
    <div>
      <PageHeader title="امروز باید روی چه چیزی کار کنم؟" />

      <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="ظرفیت این ماه"
          value={formatHours(capacity.consumed_hours)}
          subtitle={
            <>
              <span>از {formatHours(capacity.available_hours)} ظرفیت ماهانه — </span>
              {capacity.is_overloaded
                ? `⚠️ ${formatHours(capacity.overloaded_by)} اضافه‌بار نسبت به تخصیص‌ها`
                : `${formatHours(capacity.remaining_hours)} باقی‌مانده`}
            </>
          }
          tone={capacity.is_overloaded ? 'danger' : 'default'}
        />
        <StatCard
          title="ساعت تخصیص‌یافته به پروژه‌ها"
          value={formatHours(capacity.allocated_hours)}
          subtitle="مجموع نیاز پروژه‌های فعال"
        />
        <StatCard
          title="درآمد ماهانه (قراردادی)"
          value={formatToman(revenue.fixed_and_retainer)}
        />
        <StatCard
          title="درآمد ماهانه (کل)"
          value={formatToman(revenue.total)}
          subtitle={`ساعتی: ${formatToman(revenue.hourly)}`}
          tone="success"
        />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <h2 className="mb-3 text-sm font-semibold text-slate-700">
            پیشنهاد امروز ({todayTasks.length})
          </h2>
          {todayTasks.length === 0 ? (
            <div className="rounded-xl border border-dashed border-slate-300 bg-white p-8 text-center text-sm text-slate-400">
              کاری برای امروز پیشنهاد نشده — یا همه‌چیز تمام شده، یا هنوز تسکی ثبت نکرده‌اید.
            </div>
          ) : (
            <ul className="space-y-2">
              {todayTasks.map((task: Task) => (
                <li
                  key={task.id}
                  className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-medium text-slate-900">{task.title}</span>
                      <Badge
                        label={priorityLabels[task.priority]}
                        className={priorityColors[task.priority]}
                      />
                      <Badge
                        label={taskStatusLabels[task.status]}
                        className={taskStatusColors[task.status]}
                      />
                    </div>
                    <div className="mt-1 text-xs text-slate-500">
                      <Link to={`/projects/${task.project}`} className="hover:underline">
                        {task.project_name}
                      </Link>
                      {task.deadline && <span> · موعد: {task.deadline}</span>}
                    </div>
                  </div>
                  <div className="flex shrink-0 gap-2">
                    {task.status !== 'doing' && (
                      <button
                        onClick={() => startTimer.mutate(task.id)}
                        className="rounded-md border border-slate-200 px-2 py-1 text-xs font-medium text-slate-600 hover:bg-slate-50"
                      >
                        شروع تایمر
                      </button>
                    )}
                    {task.status !== 'done' && (
                      <button
                        onClick={() => setStatus.mutate({ id: task.id, status: 'done' })}
                        className="rounded-md bg-emerald-600 px-2 py-1 text-xs font-medium text-white hover:bg-emerald-700"
                      >
                        انجام شد
                      </button>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div>
          <h2 className="mb-3 text-sm font-semibold text-slate-700">وضعیت سلامت پروژه‌ها</h2>
          {projectHealth.length === 0 ? (
            <div className="rounded-xl border border-dashed border-slate-300 bg-white p-8 text-center text-sm text-slate-400">
              پروژه فعالی وجود ندارد.
            </div>
          ) : (
            <ul className="space-y-2">
              {projectHealth.map((p) => (
                <li
                  key={p.project_id}
                  className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm"
                >
                  <div className="flex items-center justify-between">
                    <Link to={`/projects/${p.project_id}`} className="font-medium text-slate-900 hover:underline">
                      {p.project_name}
                    </Link>
                    <span
                      className={`ltr-nums text-sm font-bold ${p.health_score >= 70 ? 'text-emerald-600' : p.health_score >= 40 ? 'text-amber-600' : 'text-rose-600'}`}
                    >
                      {p.health_score}%
                    </span>
                  </div>
                  <div className="text-xs text-slate-500">{p.client_name}</div>
                  <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
                    <div
                      className={`h-full ${p.health_score >= 70 ? 'bg-emerald-500' : p.health_score >= 40 ? 'bg-amber-500' : 'bg-rose-500'}`}
                      style={{ width: `${p.health_score}%` }}
                    />
                  </div>
                  {p.overdue_tasks > 0 && (
                    <div className="mt-1 text-xs text-rose-600">
                      {p.overdue_tasks} تسک عقب‌افتاده
                    </div>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  )
}
