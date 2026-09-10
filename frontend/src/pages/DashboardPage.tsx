import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { AlertTriangle, CheckCircle2, Clock3, History, ListTodo, Play, Wallet } from 'lucide-react'
import { Link } from 'react-router-dom'
import { Badge } from '../components/Badge'
import { EmptyState, PageHeader } from '../components/Layout'
import { StatCard } from '../components/StatCard'
import { api } from '../lib/api'
import { formatDate, formatHours, formatToman } from '../lib/format'
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

  const {
    capacity,
    revenue,
    project_health: projectHealth,
    today_tasks: todayTasks,
    overdue_tasks: overdueTasks,
    today_activity: todayActivity,
    today_total_hours: todayTotalHours,
  } = data

  return (
    <div>
      <PageHeader
        title="امروز باید روی چه چیزی کار کنم؟"
        subtitle="خلاصه‌ی وضعیت ظرفیت، درآمد و اولویت‌های امروز شما"
      />

      <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="ظرفیت این ماه"
          value={formatHours(capacity.consumed_hours)}
          icon={Clock3}
          tone={capacity.is_overloaded ? 'danger' : 'default'}
          subtitle={
            <>
              از {formatHours(capacity.available_hours)} ظرفیت ماهانه — {' '}
              {capacity.is_overloaded
                ? `⚠️ ${formatHours(capacity.overloaded_by)} اضافه‌بار نسبت به تخصیص‌ها`
                : `${formatHours(capacity.remaining_hours)} باقی‌مانده`}
            </>
          }
        />
        <StatCard
          title="ساعت تخصیص‌یافته به پروژه‌ها"
          value={formatHours(capacity.allocated_hours)}
          icon={ListTodo}
          subtitle="مجموع نیاز پروژه‌های فعال"
        />
        <StatCard
          title="درآمد ماهانه (قراردادی)"
          value={formatToman(revenue.fixed_and_retainer)}
          icon={Wallet}
        />
        <StatCard
          title="درآمد ماهانه (کل)"
          value={formatToman(revenue.total)}
          icon={Wallet}
          subtitle={`ساعتی: ${formatToman(revenue.hourly)}`}
          tone="success"
        />
        <StatCard
          title="ساعت کار امروز"
          value={formatHours(todayTotalHours)}
          icon={History}
          subtitle={`روی ${todayActivity.length} پروژه`}
        />
      </div>

      <div className="mb-8">
        <h2 className="mb-3 text-sm font-semibold text-slate-700">امروز روی چه پروژه‌هایی کار کردم</h2>
        {todayActivity.length === 0 ? (
          <EmptyState icon={History} title="امروز هنوز زمانی با تایمر ثبت نکرده‌اید." />
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {todayActivity.map((p) => (
              <div key={p.project_id} className="card p-4">
                <div className="mb-2 flex items-center justify-between">
                  <Link
                    to={`/projects/${p.project_id}`}
                    className="font-medium text-slate-900 hover:text-brand-600 hover:underline"
                  >
                    {p.project_name}
                  </Link>
                  <span className="text-sm font-bold text-brand-600">{formatHours(p.hours)}</span>
                </div>
                <ul className="space-y-1.5 text-sm text-slate-600">
                  {p.entries.map((entry, i) => (
                    <li key={i}>
                      <span className="text-slate-800">{entry.task_title}</span>
                      <span className="text-xs text-slate-400"> · {formatHours(entry.hours)}</span>
                      {entry.notes && <div className="text-xs text-slate-500">{entry.notes}</div>}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <h2 className="mb-3 text-sm font-semibold text-slate-700">
            پیشنهاد امروز ({todayTasks.length})
          </h2>
          {todayTasks.length === 0 ? (
            <EmptyState
              icon={CheckCircle2}
              title="هیچ تسکی با موعد امروز ندارید."
            />
          ) : (
            <ul className="space-y-2">
              {todayTasks.map((task: Task) => (
                <li
                  key={task.id}
                  className="card flex flex-wrap items-center justify-between gap-3 p-4"
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
                      <Link to={`/projects/${task.project}`} className="hover:text-brand-600 hover:underline">
                        {task.project_name}
                      </Link>
                      {task.deadline && <span> · موعد: {formatDate(task.deadline)}</span>}
                    </div>
                  </div>
                  <div className="flex shrink-0 gap-2">
                    {task.status !== 'doing' && (
                      <button onClick={() => startTimer.mutate(task.id)} className="btn-secondary !px-2.5 !py-1.5 text-xs">
                        <Play className="h-3.5 w-3.5" /> شروع تایمر
                      </button>
                    )}
                    {task.status !== 'done' && (
                      <button
                        onClick={() => setStatus.mutate({ id: task.id, status: 'done' })}
                        className="btn-primary !bg-emerald-600 !px-2.5 !py-1.5 text-xs hover:!bg-emerald-700"
                      >
                        <CheckCircle2 className="h-3.5 w-3.5" /> انجام شد
                      </button>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="space-y-6">
          <div>
            <h2 className="mb-3 text-sm font-semibold text-rose-700">
              تسک‌های عقب‌افتاده ({overdueTasks.length})
            </h2>
            {overdueTasks.length === 0 ? (
              <EmptyState icon={CheckCircle2} title="هیچ تسک عقب‌افتاده‌ای ندارید." />
            ) : (
              <ul className="space-y-2">
                {overdueTasks.map((task) => (
                  <li key={task.id} className="card border-rose-200 bg-rose-50/40 p-3">
                    <Link
                      to={`/projects/${task.project}`}
                      className="text-sm font-medium text-slate-900 hover:text-brand-600 hover:underline"
                    >
                      {task.title}
                    </Link>
                    <div className="mt-1 text-xs text-rose-600">
                      موعد: {formatDate(task.deadline)} · {task.project_name}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div>
            <h2 className="mb-3 text-sm font-semibold text-slate-700">وضعیت سلامت پروژه‌ها</h2>
          {projectHealth.length === 0 ? (
            <EmptyState icon={AlertTriangle} title="پروژه فعالی وجود ندارد." />
          ) : (
            <ul className="space-y-2">
              {projectHealth.map((p) => (
                <li key={p.project_id} className="card p-4">
                  <div className="flex items-center justify-between">
                    <Link
                      to={`/projects/${p.project_id}`}
                      className="font-medium text-slate-900 hover:text-brand-600 hover:underline"
                    >
                      {p.project_name}
                    </Link>
                    <span
                      className={`text-sm font-bold ${p.health_score >= 70 ? 'text-emerald-600' : p.health_score >= 40 ? 'text-amber-600' : 'text-rose-600'}`}
                    >
                      {p.health_score}٪
                    </span>
                  </div>
                  <div className="text-xs text-slate-500">{p.client_name}</div>
                  <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
                    <div
                      className={`h-full rounded-full ${p.health_score >= 70 ? 'bg-emerald-500' : p.health_score >= 40 ? 'bg-amber-500' : 'bg-rose-500'}`}
                      style={{ width: `${p.health_score}%` }}
                    />
                  </div>
                  {p.overdue_tasks > 0 && (
                    <div className="mt-1 text-xs text-rose-600">{p.overdue_tasks} تسک عقب‌افتاده</div>
                  )}
                </li>
              ))}
            </ul>
          )}
          </div>
        </div>
      </div>
    </div>
  )
}
