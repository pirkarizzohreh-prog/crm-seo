export const clientStatusLabels: Record<string, string> = {
  lead: 'سرنخ',
  active: 'فعال',
  paused: 'متوقف‌شده',
  lost: 'از دست رفته',
}

export const projectTypeLabels: Record<string, string> = {
  seo_monthly: 'سئو ماهانه',
  website_design: 'طراحی سایت',
  ecommerce_setup: 'راه‌اندازی فروشگاه',
  seo_audit: 'ممیزی سئو',
  consulting: 'مشاوره',
  content_marketing: 'بازاریابی محتوا',
}

export const billingTypeLabels: Record<string, string> = {
  fixed: 'پروژه‌ای (مبلغ ثابت)',
  hourly: 'ساعتی',
  retainer: 'قرارداد ماهانه',
  hybrid: 'ترکیبی',
}

export const projectStatusLabels: Record<string, string> = {
  backlog: 'بک‌لاگ',
  planning: 'برنامه‌ریزی',
  active: 'فعال',
  review: 'بازبینی',
  completed: 'تکمیل‌شده',
  paused: 'متوقف‌شده',
  cancelled: 'لغوشده',
}

export const priorityLabels: Record<string, string> = {
  low: 'کم',
  medium: 'متوسط',
  high: 'بالا',
  urgent: 'فوری',
  critical: 'بحرانی',
}

export const priorityColors: Record<string, string> = {
  low: 'bg-slate-100 text-slate-600',
  medium: 'bg-sky-100 text-sky-700',
  high: 'bg-amber-100 text-amber-700',
  urgent: 'bg-rose-100 text-rose-700',
  critical: 'bg-rose-100 text-rose-700',
}

export const taskStatusLabels: Record<string, string> = {
  backlog: 'بک‌لاگ',
  todo: 'برای انجام',
  doing: 'در حال انجام',
  review: 'بازبینی',
  done: 'انجام‌شده',
}

export const taskStatusColors: Record<string, string> = {
  backlog: 'bg-slate-100 text-slate-600',
  todo: 'bg-slate-100 text-slate-700',
  doing: 'bg-sky-100 text-sky-700',
  review: 'bg-amber-100 text-amber-700',
  done: 'bg-emerald-100 text-emerald-700',
}

export const recurrenceLabels: Record<string, string> = {
  none: 'بدون تکرار',
  weekly: 'هفتگی',
  monthly: 'ماهانه',
}

export const profitabilityLabels: Record<string, string> = {
  profitable: 'سودآور',
  balanced: 'متعادل',
  low_margin: 'کم‌سود',
  losing: 'زیان‌ده',
  unknown: 'نامشخص',
}

export const roleLabels: Record<string, string> = {
  owner: 'مالک / مدیر سئو',
  seo_specialist: 'متخصص سئو',
  content_writer: 'نویسنده محتوا',
  developer: 'توسعه‌دهنده',
  designer: 'طراح',
  client: 'کاربر پورتال مشتری',
}

export const profitabilityColors: Record<string, string> = {
  profitable: 'bg-emerald-100 text-emerald-700',
  balanced: 'bg-sky-100 text-sky-700',
  low_margin: 'bg-amber-100 text-amber-700',
  losing: 'bg-rose-100 text-rose-700',
  unknown: 'bg-slate-100 text-slate-600',
}
