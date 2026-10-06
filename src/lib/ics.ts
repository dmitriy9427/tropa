// Экспорт поездки в календарь (.ics, формат iCalendar RFC 5545).
// Каждый день — событие на весь день, в описании — места по порядку.
// Файл открывают Google Календарь, Apple Calendar и Outlook.

import { addDays } from './dates'
import { dayPlaces } from './trip'
import type { Trip } from './types'

/** Экранирование текста по RFC 5545: \ ; , и переносы строк. */
export function escapeText(text: string): string {
  return text.replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\r?\n/g, '\\n')
}

const compact = (iso: string) => iso.replaceAll('-', '')

export function tripToICS(trip: Trip, now = new Date()): string {
  const stamp = now.toISOString().replace(/[-:]/g, '').replace(/\.\d+/, '')
  const events = trip.days.map((day, i) => {
    const places = dayPlaces(trip, day)
    const lines = places.map((p, n) => `${n + 1}. ${p.name}${p.note ? ` — ${p.note}` : ''}`)
    return [
      'BEGIN:VEVENT',
      `UID:${trip.id}-${day.id}@tropa`,
      `DTSTAMP:${stamp}`,
      `DTSTART;VALUE=DATE:${compact(day.date)}`,
      `DTEND;VALUE=DATE:${compact(addDays(day.date, 1))}`,
      `SUMMARY:${escapeText(`${trip.title} · день ${i + 1}`)}`,
      `LOCATION:${escapeText(trip.city.name)}`,
      ...(lines.length ? [`DESCRIPTION:${escapeText(lines.join('\n'))}`] : []),
      'END:VEVENT',
    ].join('\r\n')
  })
  return ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Tropa//RU', 'CALSCALE:GREGORIAN', ...events, 'END:VCALENDAR'].join(
    '\r\n',
  )
}

/** Отдать файл пользователю: создаём ссылку на Blob и «нажимаем» её. */
export function downloadICS(trip: Trip): void {
  const blob = new Blob([tripToICS(trip)], { type: 'text/calendar;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `${trip.title.replace(/[^\p{L}\p{N} _-]/gu, '').trim() || 'trip'}.ics`
  a.click()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}
