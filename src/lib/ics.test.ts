import { describe, expect, it } from 'vitest'
import { demoTrip } from './demo'
import { escapeText, tripToICS } from './ics'

describe('экспорт в календарь', () => {
  it('экранирует спецсимволы iCalendar', () => {
    expect(escapeText('a, b; c\\d\ne')).toBe(String.raw`a\, b\; c\\d\ne`)
  })

  it('делает событие на каждый день поездки', () => {
    const trip = demoTrip(new Date(2026, 9, 6))
    const ics = tripToICS(trip, new Date('2026-10-06T10:00:00Z'))
    expect(ics.match(/BEGIN:VEVENT/g)).toHaveLength(3)
    expect(ics).toContain('DTSTART;VALUE=DATE:20261013')
    expect(ics).toContain('DTEND;VALUE=DATE:20261014')
    expect(ics).toContain('SUMMARY:Выходные в Казани · день 1')
    expect(ics).toContain('1. Казанский кремль')
    expect(ics.split('\r\n')[0]).toBe('BEGIN:VCALENDAR')
  })
})
