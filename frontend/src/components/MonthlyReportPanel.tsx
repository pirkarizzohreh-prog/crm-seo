import { useQuery } from '@tanstack/react-query'
import { CalendarRange, CheckCircle2, FileBarChart, FileDown, FileSpreadsheet, NotebookText } from 'lucide-react'
import { useState } from 'react'
import { api } from '../lib/api'
import { formatDate, formatHours, formatToman, gregorianMonthNames } from '../lib/format'
import { EmptyState } from './Layout'
import { StatCard } from './StatCard'

interface MonthlyReport {
  project_name: string
  period_start: string
  period_end: string
  completed_tasks: {
    id: number
    title: string
    category_name: string | null
    completed_at: string
    value_generated: string | null
  }[]
  hours_by_category: { category_name: string; hours: string }[]
  activity_log: { date: string; task_title: string; hours: string; notes: string }[]
  total_hours: string
  total_value_generated: string
  contract_amount: string | null
  task_count: number
}

export function MonthlyReportPanel({ projectId }: { projectId: number }) {
  const now = new Date()
  const [year, setYear] = useState(now.getFullYear())
  const [month, setMonth] = useState(now.getMonth() + 1)
  const [downloading, setDownloading] = useState(false)
  const [downloadingXlsx, setDownloadingXlsx] = useState(false)

  const { data, isLoading } = useQuery<MonthlyReport>({
    queryKey: ['monthly-report', projectId, year, month],
    queryFn: async () =>
      (await api.get(`/projects/${projectId}/monthly-report/`, { params: { year, month } })).data,
  })

  async function downloadFile(path: string, extension: string, mimeType: string, setBusy: (b: boolean) => void) {
    setBusy(true)
    try {
      const response = await api.get(path, { params: { year, month }, responseType: 'blob' })
      const url = window.URL.createObjectURL(new Blob([response.data], { type: mimeType }))
      const link = document.createElement('a')
      link.href = url
      link.download = `report-${projectId}-${year}-${String(month).padStart(2, '0')}.${extension}`
      document.body.appendChild(link)
      link.click()
      link.remove()
      window.URL.revokeObjectURL(url)
    } finally {
      setBusy(false)
    }
  }

  const downloadPdf = () =>
    downloadFile(`/projects/${projectId}/monthly-report/pdf/`, 'pdf', 'application/pdf', setDownloading)

  const downloadXlsx = () =>
    downloadFile(
      `/projects/${projectId}/monthly-report/xlsx/`,
      'xlsx',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      setDownloadingXlsx,
    )

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <select
            value={month}
            onChange={(e) => setMonth(Number(e.target.value))}
            className="field-input w-auto"
          >
            {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
              <option key={m} value={m}>
                {gregorianMonthNames[m - 1]}
              </option>
            ))}
          </select>
          <input
            type="number"
            value={year}
            onChange={(e) => setYear(Number(e.target.value))}
            className="field-input ltr-nums w-24"
          />
        </div>
        <div className="flex gap-2">
          <button onClick={downloadXlsx} disabled={downloadingXlsx} className="btn-secondary">
            <FileSpreadsheet className="h-4 w-4" /> {downloadingXlsx ? 'در حال آماده‌سازی...' : 'دانلود اکسل'}
          </button>
          <button onClick={downloadPdf} disabled={downloading} className="btn-secondary">
            <FileDown className="h-4 w-4" /> {downloading ? 'در حال آماده‌سازی...' : 'دانلود PDF'}
          </button>
        </div>
      </div>

      {isLoading || !data ? (
        <p className="text-sm text-slate-500">در حال بارگذاری...</p>
      ) : (
        <>
          <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard title="تسک‌های انجام‌شده" value={data.task_count} icon={CheckCircle2} />
            <StatCard title="ساعت کار ثبت‌شده" value={formatHours(data.total_hours)} icon={CalendarRange} />
            <StatCard title="ارزش خروجی تولیدشده" value={formatToman(data.total_value_generated)} icon={FileBarChart} />
            <StatCard title="مبلغ قرارداد" value={formatToman(data.contract_amount)} tone="brand" />
          </div>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <div>
              <h3 className="mb-3 text-sm font-semibold text-slate-700">فعالیت‌های انجام‌شده</h3>
              {data.completed_tasks.length === 0 ? (
                <EmptyState icon={CheckCircle2} title="در این ماه تسکی تکمیل نشده است." />
              ) : (
                <ul className="space-y-2">
                  {data.completed_tasks.map((t) => (
                    <li key={t.id} className="card flex items-center justify-between p-3 text-sm">
                      <div>
                        <div className="font-medium text-slate-900">{t.title}</div>
                        {t.category_name && <div className="text-xs text-slate-500">{t.category_name}</div>}
                      </div>
                      {t.value_generated && (
                        <div className="text-xs font-medium text-emerald-600">
                          {formatToman(t.value_generated)}
                        </div>
                      )}
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div>
              <h3 className="mb-3 text-sm font-semibold text-slate-700">ساعت کار به تفکیک دسته</h3>
              {data.hours_by_category.length === 0 ? (
                <EmptyState icon={CalendarRange} title="زمانی برای این ماه ثبت نشده است." />
              ) : (
                <ul className="card divide-y divide-slate-100">
                  {data.hours_by_category.map((row) => (
                    <li key={row.category_name} className="flex items-center justify-between px-4 py-3 text-sm">
                      <span className="text-slate-700">{row.category_name}</span>
                      <span className="font-medium text-slate-900">{formatHours(row.hours)}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>

          <div className="mt-6">
            <h3 className="mb-3 text-sm font-semibold text-slate-700">یادداشت‌های فعالیت روزانه</h3>
            {data.activity_log.length === 0 ? (
              <EmptyState icon={NotebookText} title="زمانی برای این ماه ثبت نشده است." />
            ) : (
              <ul className="card divide-y divide-slate-100">
                {data.activity_log.map((entry, i) => (
                  <li key={i} className="flex flex-wrap items-start justify-between gap-2 px-4 py-3 text-sm">
                    <div className="min-w-0">
                      <div className="font-medium text-slate-900">{entry.task_title}</div>
                      <div className="text-xs text-slate-500">
                        {formatDate(entry.date)} · {formatHours(entry.hours)}
                      </div>
                      {entry.notes && <div className="mt-1 text-slate-600">{entry.notes}</div>}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </>
      )}
    </div>
  )
}
