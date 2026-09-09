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

export function formatDate(value: string | null | undefined): string {
  if (!value) return '—'
  return new Intl.DateTimeFormat('fa-IR', { year: 'numeric', month: 'long', day: 'numeric' }).format(
    new Date(value),
  )
}
