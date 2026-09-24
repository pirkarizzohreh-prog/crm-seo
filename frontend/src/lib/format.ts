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

// Decimal hours ("1.6 ساعت") reads as ambiguous — is that 1h6m or 1h60m? —
// so every hours display goes through this to show "1 ساعت و 36 دقیقه"
// instead, with no arithmetic left for the reader to do.
export function formatHours(value: number | string | null | undefined): string {
  if (value === null || value === undefined || value === '') return '—'
  const num = typeof value === 'string' ? parseFloat(value) : value
  if (Number.isNaN(num)) return '—'

  const sign = num < 0 ? '-' : ''
  const totalMinutes = Math.round(Math.abs(num) * 60)
  const hours = Math.floor(totalMinutes / 60)
  const minutes = totalMinutes % 60

  if (hours === 0 && minutes === 0) return '0 ساعت'
  if (hours === 0) return `${sign}${minutes} دقیقه`
  if (minutes === 0) return `${sign}${hours} ساعت`
  return `${sign}${hours} ساعت و ${minutes} دقیقه`
}

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
