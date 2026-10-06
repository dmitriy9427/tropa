// Даты поездки храним строками YYYY-MM-DD: это «день в календаре», а не момент
// времени. new Date('2026-10-06') — полночь по UTC, и в Москве это ещё 6-е,
// а в Нью-Йорке уже 5-е. Поэтому считаем дни в UTC и не трогаем часовой пояс.

const DAY_MS = 86_400_000

export function toISODate(date: Date): string {
  return date.toISOString().slice(0, 10)
}

/** Сегодняшняя дата по часам пользователя (а не по UTC). */
export function today(now = new Date()): string {
  const y = now.getFullYear()
  const m = String(now.getMonth() + 1).padStart(2, '0')
  const d = String(now.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

export function addDays(iso: string, days: number): string {
  return toISODate(new Date(Date.parse(iso) + days * DAY_MS))
}

export function daysBetween(from: string, to: string): number {
  return Math.round((Date.parse(to) - Date.parse(from)) / DAY_MS)
}

/** Список дат подряд: dateRange('2026-10-06', 3) → 6, 7, 8 октября. */
export function dateRange(start: string, count: number): string[] {
  return Array.from({ length: count }, (_, i) => addDays(start, i))
}

const weekday = new Intl.DateTimeFormat('ru-RU', { weekday: 'short', timeZone: 'UTC' })
const dayMonth = new Intl.DateTimeFormat('ru-RU', { day: 'numeric', month: 'long', timeZone: 'UTC' })
const dayMonthShort = new Intl.DateTimeFormat('ru-RU', { day: 'numeric', month: 'short', timeZone: 'UTC' })

/** «6 октября» */
export function formatDay(iso: string): string {
  return dayMonth.format(new Date(iso))
}

/** «вт» */
export function formatWeekday(iso: string): string {
  return weekday.format(new Date(iso)).replace('.', '')
}

/** «6–8 окт.» или «30 сент. – 2 окт.» */
export function formatRange(start: string, end: string): string {
  const a = new Date(start)
  const b = new Date(end)
  if (start === end) return dayMonthShort.format(a)
  if (a.getUTCMonth() === b.getUTCMonth()) {
    return `${a.getUTCDate()}–${dayMonthShort.format(b)}`
  }
  return `${dayMonthShort.format(a)} – ${dayMonthShort.format(b)}`
}

/** 1 день, 2 дня, 5 дней. */
export function plural(n: number, one: string, few: string, many: string): string {
  const mod10 = n % 10
  const mod100 = n % 100
  if (mod10 === 1 && mod100 !== 11) return one
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) return few
  return many
}
