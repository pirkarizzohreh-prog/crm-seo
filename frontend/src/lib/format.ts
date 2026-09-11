const numberFormatter = new Intl.NumberFormat('en-US')

export function formatNumber(value: number | string | null | undefined, digits = 1): string {
  if (value === null || value === undefined || value === '') return '—'
  const num = typeof value === 'string' ? parseFloat(value) : value
  if (Number.isNaN(num)) return '—'
  const rounded = Math.round(num * 10 ** digits) / 10 ** digits
  return numberFormatter.format(rounded)
}

export function formatToman(value: number | string | null | undefined): string {
  if (value === null || value === undefined || value === '') return '—'
  const num = typeof value === 'string' ? parseFloat(value) : value
  if (Number.isNaN(num)) return '—'
  return `${numberFormatter.format(Math.round(num))} تومان`
}

export function formatHours(value: number | string | null | undefined): string {
  const formatted = formatNumber(value, 1)
  return formatted === '—' ? formatted : `${formatted} ساعت`
}

// The API's year/month query params (monthly report, payments) are plain
// Gregorian (Python's calendar.monthrange) — these are Gregorian month
// names, not Jalali ones ("فروردین" etc.), which would mislabel the period.
export const gregorianMonthNames = [
  'ژانویه',
  'فوریه',
  'مارس',
  'آوریل',
  'مه',
  'ژوئن',
  'ژوئیه',
  'اوت',
  'سپتامبر',
  'اکتبر',
  'نوامبر',
  'دسامبر',
]

export function formatDate(value: string | null | undefined): string {
  if (!value) return '—'
  return new Intl.DateTimeFormat('fa-IR', { year: 'numeric', month: 'long', day: 'numeric' }).format(
    new Date(value),
  )
}

/** For a finished task: how much faster the real (timer-logged) hours came
 * in under the estimate, as a ready-to-show label — or null when there's
 * nothing to brag about (no estimate, no time logged, or it ran over). */
export function fasterThanEstimateLabel(
  actualHours: number | string | null | undefined,
  estimatedHours: number | string | null | undefined,
): string | null {
  const actual = typeof actualHours === 'string' ? parseFloat(actualHours) : actualHours
  const estimated = typeof estimatedHours === 'string' ? parseFloat(estimatedHours) : estimatedHours
  if (!actual || !estimated || Number.isNaN(actual) || Number.isNaN(estimated)) return null
  if (actual >= estimated) return null
  const percent = Math.round((1 - actual / estimated) * 100)
  if (percent <= 0) return null
  return `٪${percent} سریع‌تر از تخمین`
}
