import {
  CalendarDays,
  Clock,
  LayoutDashboard,
  LayoutGrid,
  LayoutTemplate,
  ListChecks,
  LogOut,
  Menu,
  Search,
  Users,
  Users2,
  Wallet,
  X,
} from 'lucide-react'
import { type ReactNode, useState } from 'react'
import { NavLink, Outlet } from 'react-router-dom'
import { useAuth } from '../lib/auth'
import { useMe } from '../lib/useMe'
import { TimerWidget } from './TimerWidget'

const navItems = [
  { to: '/', label: 'داشبورد امروز', icon: LayoutDashboard, end: true },
  { to: '/calendar', label: 'تقویم', icon: CalendarDays },
  { to: '/clients', label: 'مشتری‌ها', icon: Users2 },
  { to: '/projects', label: 'پروژه‌ها', icon: Wallet },
  { to: '/overview', label: 'نمای کلی پروژه‌ها', icon: LayoutGrid },
  { to: '/tasks', label: 'تسک‌ها', icon: ListChecks },
  { to: '/templates', label: 'قالب‌های تسک', icon: LayoutTemplate },
  { to: '/time', label: 'گزارش زمان', icon: Clock },
]

const ownerOnlyNavItems = [{ to: '/team', label: 'اعضای تیم', icon: Users, end: false }]

function SidebarContent({ onNavigate }: { onNavigate?: () => void }) {
  const { logout } = useAuth()
  const { data: me } = useMe()
  const items = me?.is_owner ? [...navItems, ...ownerOnlyNavItems] : navItems

  return (
    <>
      <div className="mb-8 flex items-center gap-3 px-2">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-600 text-lg font-bold text-white">
          س
        </div>
        <div className="min-w-0">
          <div className="truncate text-sm font-bold text-slate-900">سیستم عملیات آژانس سئو</div>
          <div className="text-xs text-slate-400">شخصی — نسخه فاز ۱</div>
        </div>
      </div>
      <nav className="space-y-1">
        {items.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            onClick={onNavigate}
            className={({ isActive }) =>
              `flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition ${
                isActive
                  ? 'bg-brand-50 text-brand-700'
                  : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
              }`
            }
          >
            <item.icon className="h-4 w-4 shrink-0" strokeWidth={2} />
            {item.label}
          </NavLink>
        ))}
      </nav>
      <button
        onClick={logout}
        className="mt-8 flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-slate-400 hover:bg-slate-100 hover:text-slate-700"
      >
        <LogOut className="h-4 w-4" strokeWidth={2} />
        خروج از حساب
      </button>
    </>
  )
}

export function Layout() {
  const [mobileOpen, setMobileOpen] = useState(false)

  return (
    <div className="flex min-h-screen bg-slate-50">
      <aside className="hidden w-64 shrink-0 border-l border-slate-200 bg-white p-4 sm:block">
        <SidebarContent />
      </aside>

      {mobileOpen && (
        <div className="fixed inset-0 z-40 sm:hidden">
          <div className="absolute inset-0 bg-slate-900/40" onClick={() => setMobileOpen(false)} />
          <aside className="absolute inset-y-0 right-0 w-64 bg-white p-4 shadow-xl">
            <button
              onClick={() => setMobileOpen(false)}
              className="mb-4 rounded-full p-1 text-slate-400 hover:bg-slate-100"
            >
              <X className="h-5 w-5" />
            </button>
            <SidebarContent onNavigate={() => setMobileOpen(false)} />
          </aside>
        </div>
      )}

      <div className="flex min-h-screen flex-1 flex-col">
        <header className="flex items-center justify-between border-b border-slate-200 bg-white px-4 py-3 sm:hidden">
          <div className="font-bold text-slate-900">سیستم عملیات آژانس سئو</div>
          <button onClick={() => setMobileOpen(true)} className="text-slate-500">
            <Menu className="h-6 w-6" />
          </button>
        </header>

        <div className="border-b border-slate-200 bg-white px-4 py-2 sm:px-8">
          <TimerWidget />
        </div>

        <main className="flex-1 px-4 py-6 sm:px-8">
          <Outlet />
        </main>
      </div>
    </div>
  )
}

export function PageHeader({
  title,
  subtitle,
  actions,
}: {
  title: string
  subtitle?: ReactNode
  actions?: ReactNode
}) {
  return (
    <div className="mb-6 flex flex-wrap items-start justify-between gap-3">
      <div>
        <h1 className="text-xl font-bold text-slate-900">{title}</h1>
        {subtitle && <p className="mt-1 text-sm text-slate-500">{subtitle}</p>}
      </div>
      {actions}
    </div>
  )
}

export function EmptyState({
  icon: Icon = Search,
  title,
  action,
}: {
  icon?: typeof Search
  title: string
  action?: ReactNode
}) {
  return (
    <div className="card flex flex-col items-center gap-3 border-dashed p-10 text-center">
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-slate-400">
        <Icon className="h-6 w-6" strokeWidth={1.75} />
      </div>
      <p className="text-sm text-slate-400">{title}</p>
      {action}
    </div>
  )
}
