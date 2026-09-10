import { X } from 'lucide-react'
import { isoToJalali, jalaliMonthLength, jalaliMonthNames, jalaliToISO, toJalali } from '../lib/jalali'

/** Three linked day/month/year selects for picking a date in the Jalali
 * (Shamsi) calendar — a drop-in replacement for `<input type="date">`,
 * which always shows the Gregorian calendar regardless of app locale.
 * `value`/`onChange` still speak the ISO "YYYY-MM-DD" string the API uses. */
export function JalaliDateInput({
  value,
  onChange,
  required,
  clearable = !required,
}: {
  value: string | null | undefined
  onChange: (iso: string) => void
  required?: boolean
  clearable?: boolean
}) {
  const todayJalali = toJalali(new Date())
  const parsed = value ? isoToJalali(value) : null
  const jy = parsed?.jy ?? todayJalali.jy
  const jm = parsed?.jm ?? todayJalali.jm
  const jd = parsed?.jd ?? todayJalali.jd
  const hasValue = !!parsed

  const daysInMonth = jalaliMonthLength(jy, jm)
  const yearOptions = Array.from({ length: 15 }, (_, i) => todayJalali.jy + 5 - i)

  function set(next: Partial<{ jy: number; jm: number; jd: number }>) {
    const ny = next.jy ?? jy
    const nm = next.jm ?? jm
    const nd = Math.min(next.jd ?? jd, jalaliMonthLength(ny, nm))
    onChange(jalaliToISO(ny, nm, nd))
  }

  const selectClass = '!w-auto min-w-0 flex-1 field-input'

  return (
    <div className="flex items-center gap-1.5">
      <select
        required={required}
        value={hasValue ? jd : ''}
        onChange={(e) => set({ jd: Number(e.target.value) })}
        className={selectClass}
      >
        <option value="" disabled>
          روز
        </option>
        {Array.from({ length: daysInMonth }, (_, i) => i + 1).map((d) => (
          <option key={d} value={d}>
            {d}
          </option>
        ))}
      </select>
      <select
        required={required}
        value={hasValue ? jm : ''}
        onChange={(e) => set({ jm: Number(e.target.value) })}
        className={selectClass}
      >
        <option value="" disabled>
          ماه
        </option>
        {jalaliMonthNames.map((name, i) => (
          <option key={name} value={i + 1}>
            {name}
          </option>
        ))}
      </select>
      <select
        required={required}
        value={hasValue ? jy : ''}
        onChange={(e) => set({ jy: Number(e.target.value) })}
        className={selectClass}
      >
        <option value="" disabled>
          سال
        </option>
        {yearOptions.map((y) => (
          <option key={y} value={y}>
            {y}
          </option>
        ))}
      </select>
      {clearable && hasValue && (
        <button
          type="button"
          onClick={() => onChange('')}
          className="shrink-0 rounded-md p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
          title="پاک کردن تاریخ"
        >
          <X className="h-4 w-4" />
        </button>
      )}
    </div>
  )
}
