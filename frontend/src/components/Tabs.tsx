export function Tabs({
  tabs,
  active,
  onChange,
}: {
  tabs: { key: string; label: string }[]
  active: string
  onChange: (key: string) => void
}) {
  return (
    <div className="mb-6 flex gap-1 border-b border-slate-200">
      {tabs.map((tab) => (
        <button
          key={tab.key}
          onClick={() => onChange(tab.key)}
          className={`relative -mb-px border-b-2 px-3 py-2 text-sm font-medium transition ${
            active === tab.key
              ? 'border-brand-600 text-brand-700'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          {tab.label}
        </button>
      ))}
    </div>
  )
}
