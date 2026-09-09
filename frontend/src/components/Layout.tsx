import type { ReactNode } from 'react'
import { NavLink, Outlet } from 'react-router-dom'
import { useAuth } from '../lib/auth'
import { TimerWidget } from './TimerWidget'

const navItems = [
  { to: '/', label: 'داشبورد امروز', end: true },
  { to: '/clients', label: 'مشتری‌ها' },
  { to: '/projects', label: 'پروژه‌ها' },
  { to: '/tasks', label: 'تسک‌ها' },
  { to: '/time', label: 'گزارش زمان' },
]

function NavIcon() {
  return <span className="inline-block h-1.5 w-1.5 rounded-full bg-current opacity-60" />
}

export function Layout() {
  const { logout } = useAuth()

  return (
    <div className="flex min-h-screen bg-slate-50">
      <aside className="hidden w-60 shrink-0 border-l border-slate-200 bg-white p-4 sm:block">
        <div className="mb-8 px-2">
          <div className="text-lg font-bold text-slate-900">سیستم عملیات آژانس سئو</div>
          <div className="text-xs text-slate-400">شخصی — نسخه فاز ۱</div>
        </div>
        <nav className="space-y-1">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                `flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition ${
                  isActive
                    ? 'bg-slate-900 text-white'
                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                }`
              }
            >
              <NavIcon />
              {item.label}
            </NavLink>
          ))}
        </nav>
        <button
          onClick={logout}
          className="mt-8 w-full rounded-lg px-3 py-2 text-start text-sm text-slate-400 hover:bg-slate-100 hover:text-slate-700"
        >
          خروج از حساب
        </button>
      </aside>

      <div className="flex min-h-screen flex-1 flex-col">
        <header className="flex items-center justify-between border-b border-slate-200 bg-white px-4 py-3 sm:hidden">
          <div className="font-bold text-slate-900">سیستم عملیات آژانس سئو</div>
          <button onClick={logout} className="text-sm text-slate-400">
            خروج
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
  actions,
}: {
  title: string
  actions?: ReactNode
}) {
  return (
    <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
      <h1 className="text-xl font-bold text-slate-900">{title}</h1>
      {actions}
    </div>
  )
}
