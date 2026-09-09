import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { AlertTriangle, MousePointerClick, Percent, TrendingUp, Zap } from 'lucide-react'
import { useState } from 'react'
import { api } from '../lib/api'
import { formatNumber } from '../lib/format'
import type { Project } from '../types'
import { StatCard } from './StatCard'

interface SearchConsoleRow {
  clicks: number
  impressions: number
  ctr: number
  position: number
}

interface SearchConsoleSummary {
  site_url: string
  period_start: string
  period_end: string
  total_clicks: number
  total_impressions: number
  average_ctr: number
  average_position: number
  top_queries: (SearchConsoleRow & { query: string })[]
  top_pages: (SearchConsoleRow & { page: string })[]
}

export function SearchConsolePanel({ project }: { project: Project }) {
  const queryClient = useQueryClient()
  const [siteUrl, setSiteUrl] = useState(project.search_console_site_url ?? '')

  const saveSiteUrl = useMutation({
    mutationFn: () => api.patch(`/projects/${project.id}/`, { search_console_site_url: siteUrl }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['projects', String(project.id)] }),
  })

  const { data, isLoading, error } = useQuery<SearchConsoleSummary>({
    queryKey: ['search-console', project.id],
    queryFn: async () => (await api.get(`/projects/${project.id}/search-console/`)).data,
    enabled: !!project.search_console_site_url,
    retry: false,
  })

  if (!project.search_console_site_url) {
    return (
      <div className="card max-w-lg p-5">
        <h3 className="mb-1 text-sm font-semibold text-slate-800">اتصال Google Search Console</h3>
        <p className="mb-3 text-sm text-slate-500">
          آدرس دقیق پراپرتی سرچ کنسول این سایت را وارد کنید (مثلاً{' '}
          <code className="rounded bg-slate-100 px-1">https://example.com/</code> یا{' '}
          <code className="rounded bg-slate-100 px-1">sc-domain:example.com</code>).
        </p>
        <div className="flex gap-2">
          <input
            value={siteUrl}
            onChange={(e) => setSiteUrl(e.target.value)}
            placeholder="https://example.com/"
            className="field-input ltr-nums flex-1"
          />
          <button onClick={() => saveSiteUrl.mutate()} disabled={!siteUrl || saveSiteUrl.isPending} className="btn-primary">
            ذخیره
          </button>
        </div>
      </div>
    )
  }

  const errorMessage = (error as { response?: { data?: { detail?: string } } } | undefined)?.response
    ?.data?.detail

  if (errorMessage) {
    return (
      <div className="card max-w-xl p-5">
        <div className="flex items-start gap-2 text-sm text-amber-800">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      </div>
    )
  }

  if (isLoading || !data) return <p className="text-sm text-slate-500">در حال بارگذاری...</p>

  return (
    <div>
      <p className="mb-4 text-xs text-slate-400">
        {data.site_url} · {data.period_start} تا {data.period_end}
      </p>
      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard title="کلیک" value={formatNumber(data.total_clicks, 0)} icon={MousePointerClick} />
        <StatCard title="ایمپرشن" value={formatNumber(data.total_impressions, 0)} icon={Zap} />
        <StatCard title="نرخ کلیک (CTR)" value={`${data.average_ctr}٪`} icon={Percent} />
        <StatCard title="میانگین رتبه" value={data.average_position} icon={TrendingUp} />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div>
          <h3 className="mb-3 text-sm font-semibold text-slate-700">پرکلیک‌ترین کوئری‌ها</h3>
          <div className="card overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-xs text-slate-500">
                  <th className="px-3 py-2 text-start">کوئری</th>
                  <th className="px-3 py-2 text-start">کلیک</th>
                  <th className="px-3 py-2 text-start">رتبه</th>
                </tr>
              </thead>
              <tbody>
                {data.top_queries.map((row, i) => (
                  <tr key={i} className="border-b border-slate-100 last:border-0">
                    <td className="px-3 py-2 text-slate-800">{row.query}</td>
                    <td className="px-3 py-2 text-slate-600">{row.clicks}</td>
                    <td className="px-3 py-2 text-slate-600">{row.position}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
        <div>
          <h3 className="mb-3 text-sm font-semibold text-slate-700">پربازدیدترین صفحات</h3>
          <div className="card overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-xs text-slate-500">
                  <th className="px-3 py-2 text-start">صفحه</th>
                  <th className="px-3 py-2 text-start">کلیک</th>
                  <th className="px-3 py-2 text-start">رتبه</th>
                </tr>
              </thead>
              <tbody>
                {data.top_pages.map((row, i) => (
                  <tr key={i} className="border-b border-slate-100 last:border-0">
                    <td className="max-w-[200px] truncate px-3 py-2 text-slate-800">{row.page}</td>
                    <td className="px-3 py-2 text-slate-600">{row.clicks}</td>
                    <td className="px-3 py-2 text-slate-600">{row.position}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}
