import { useQuery } from '@tanstack/react-query'
import { LayoutGrid } from 'lucide-react'
import { Link } from 'react-router-dom'
import { Badge } from '../components/Badge'
import { EmptyState, PageHeader } from '../components/Layout'
import { api } from '../lib/api'
import { deliveryStatusColors, deliveryStatusLabels } from '../lib/labels'
import type { DeliveryStatusValue, Paginated, Project } from '../types'

const statusOrder: Record<DeliveryStatusValue, number> = { behind: 0, at_risk: 1, on_track: 2 }

export function OverviewPage() {
  const { data, isLoading } = useQuery<Paginated<Project>>({
    queryKey: ['projects', { forOverview: true }],
    queryFn: async () => (await api.get('/projects/', { params: { page_size: 200 } })).data,
  })

  const projects = [...(data?.results ?? [])].sort((a, b) => {
    const byStatus = statusOrder[a.delivery_status.status] - statusOrder[b.delivery_status.status]
    if (byStatus !== 0) return byStatus
    return a.delivery_status.progress_percent - b.delivery_status.progress_percent
  })

  return (
    <div>
      <PageHeader
        title="نمای کلی پروژه‌ها"
        subtitle="وضعیت هر پروژه خودکار از روی درصد تسک‌های انجام‌شده نسبت به موعدشان محاسبه می‌شود."
      />

      {isLoading ? (
        <p className="text-sm text-slate-500">در حال بارگذاری...</p>
      ) : projects.length === 0 ? (
        <EmptyState icon={LayoutGrid} title="هنوز پروژه‌ای ثبت نشده است." />
      ) : (
        <div className="card overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-xs text-slate-500">
                <th className="px-4 py-3 text-start">پروژه</th>
                <th className="px-4 py-3 text-start">وضعیت</th>
                <th className="px-4 py-3 text-start">پیشرفت</th>
                <th className="px-4 py-3 text-start">تسک‌ها</th>
                <th className="px-4 py-3 text-start">موعدهای رسیده</th>
              </tr>
            </thead>
            <tbody>
              {projects.map((p) => {
                const d = p.delivery_status
                const missedDue = d.due_tasks - d.completed_due_tasks
                return (
                  <tr key={p.id} className="border-b border-slate-100 last:border-0 hover:bg-slate-50/60">
                    <td className="px-4 py-3">
                      <Link
                        to={`/projects/${p.id}`}
                        className="font-medium text-slate-900 hover:text-brand-600 hover:underline"
                      >
                        {p.name}
                      </Link>
                      <div className="text-xs text-slate-500">{p.client_name}</div>
                    </td>
                    <td className="px-4 py-3">
                      <Badge label={deliveryStatusLabels[d.status]} className={deliveryStatusColors[d.status]} />
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="h-1.5 w-28 overflow-hidden rounded-full bg-slate-100">
                          <div
                            className="h-full rounded-full bg-brand-500"
                            style={{ width: `${d.progress_percent}%` }}
                          />
                        </div>
                        <span className="text-xs font-medium text-slate-700">{d.progress_percent}٪</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-slate-600">
                      {d.completed_tasks} از {d.total_tasks}
                    </td>
                    <td className="px-4 py-3">
                      {missedDue > 0 ? (
                        <span className="font-medium text-rose-600">{missedDue} تسک</span>
                      ) : (
                        <span className="text-slate-400">—</span>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
