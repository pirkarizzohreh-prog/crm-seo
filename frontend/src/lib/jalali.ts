// Jalali (Persian/Shamsi) calendar conversion — the standard astronomical
// algorithm (same one used by the widely-used `jalaali-js` package),
// reimplemented locally so the calendar page doesn't need a network
// dependency to build.

function div(a: number, b: number): number {
  return ~~(a / b)
}

function mod(a: number, b: number): number {
  return a - ~~(a / b) * b
}

const breaks = [
  -61, 9, 38, 199, 426, 686, 756, 818, 1111, 1181, 1210, 1635, 2060, 2097, 2192, 2262, 2324, 2394,
  2456, 3178,
]

function jalCal(jy: number) {
  const gy = jy + 621
  let leapJ = -14
  let jp = breaks[0]
  let jump = 0
  for (let i = 1; i < breaks.length; i += 1) {
    const jm = breaks[i]
    jump = jm - jp
    if (jy < jm) break
    leapJ += div(jump, 33) * 8 + div(mod(jump, 33), 4)
    jp = jm
  }
  let n = jy - jp
  leapJ += div(n, 33) * 8 + div(mod(n, 33) + 3, 4)
  if (mod(jump, 33) === 4 && jump - n === 4) leapJ += 1
  const leapG = div(gy, 4) - div((div(gy, 100) + 1) * 3, 4) - 150
  const march = 20 + leapJ - leapG
  if (jump - n < 6) n = n - jump + div(jump, 33) * 33
  let leap = mod(mod(n + 1, 33) - 1, 4)
  if (leap === -1) leap = 4
  return { leap, gy, march }
}

function g2d(gy: number, gm: number, gd: number): number {
  let d =
    div((gy + div(gm - 8, 6) + 100100) * 1461, 4) + div(153 * mod(gm + 9, 12) + 2, 5) + gd - 34840408
  d = d - div(div(gy + 100100 + div(gm - 8, 6), 100) * 3, 4) + 752
  return d
}

function d2g(jdn: number): { gy: number; gm: number; gd: number } {
  let j = 4 * jdn + 139361631
  j = j + div(div(4 * jdn + 183187720, 146097) * 3, 4) * 4 - 3908
  const i = div(mod(j, 1461), 4) * 5 + 308
  const gd = div(mod(i, 153), 5) + 1
  const gm = mod(div(i, 153), 12) + 1
  const gy = div(j, 1461) - 100100 + div(8 - gm, 6)
  return { gy, gm, gd }
}

function j2d(jy: number, jm: number, jd: number): number {
  const r = jalCal(jy)
  return g2d(r.gy, 3, r.march) + (jm - 1) * 31 - div(jm, 7) * (jm - 7) + jd - 1
}

function d2j(jdn: number): { jy: number; jm: number; jd: number } {
  const gy = d2g(jdn).gy
  let jy = gy - 621
  const r = jalCal(jy)
  const jdn1f = g2d(gy, 3, r.march)
  let k = jdn - jdn1f
  if (k >= 0) {
    if (k <= 185) {
      return { jy, jm: 1 + div(k, 31), jd: mod(k, 31) + 1 }
    }
    k -= 186
  } else {
    jy -= 1
    k += 179
    if (r.leap === 1) k += 1
  }
  return { jy, jm: 7 + div(k, 30), jd: mod(k, 30) + 1 }
}

export function toJalali(date: Date): { jy: number; jm: number; jd: number } {
  return d2j(g2d(date.getFullYear(), date.getMonth() + 1, date.getDate()))
}

function jalaliToGregorianParts(jy: number, jm: number, jd: number): { gy: number; gm: number; gd: number } {
  return d2g(j2d(jy, jm, jd))
}

export function jalaliToGregorian(jy: number, jm: number, jd: number): Date {
  const { gy, gm, gd } = jalaliToGregorianParts(jy, jm, jd)
  return new Date(gy, gm - 1, gd)
}

/** Parse an ISO "YYYY-MM-DD" string (as stored/sent by the API) straight
 * into its Jalali parts, without going through a JS Date — avoids any
 * timezone-related day-shift from Date's UTC parsing of date-only strings. */
export function isoToJalali(iso: string): { jy: number; jm: number; jd: number } | null {
  if (!iso) return null
  const [gy, gm, gd] = iso.split('-').map(Number)
  if (!gy || !gm || !gd) return null
  return d2j(g2d(gy, gm, gd))
}

/** Inverse of isoToJalali: format a Jalali date back into the "YYYY-MM-DD"
 * string the API expects, again without an intermediate Date object. */
export function jalaliToISO(jy: number, jm: number, jd: number): string {
  const { gy, gm, gd } = jalaliToGregorianParts(jy, jm, jd)
  return `${String(gy).padStart(4, '0')}-${String(gm).padStart(2, '0')}-${String(gd).padStart(2, '0')}`
}

export function isLeapJalaliYear(jy: number): boolean {
  return jalCal(jy).leap === 0
}

export function jalaliMonthLength(jy: number, jm: number): number {
  if (jm <= 6) return 31
  if (jm <= 11) return 30
  return isLeapJalaliYear(jy) ? 30 : 29
}

/** Add (or subtract) whole months to a Jalali year/month, rolling the year over. */
export function addJalaliMonths(jy: number, jm: number, delta: number): { jy: number; jm: number } {
  const m = jm - 1 + delta
  const y = jy + Math.floor(m / 12)
  return { jy: y, jm: (((m % 12) + 12) % 12) + 1 }
}

export const jalaliMonthNames = [
  'فروردین',
  'اردیبهشت',
  'خرداد',
  'تیر',
  'مرداد',
  'شهریور',
  'مهر',
  'آبان',
  'آذر',
  'دی',
  'بهمن',
  'اسفند',
]
