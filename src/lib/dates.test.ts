import { describe, expect, it } from 'vitest'
import { addDays, dateRange, daysBetween, formatDay, formatRange, plural, today } from './dates'

describe('dates', () => {
  it('добавляет дни через границу месяца и года', () => {
    expect(addDays('2026-10-31', 1)).toBe('2026-11-01')
    expect(addDays('2026-12-31', 1)).toBe('2027-01-01')
    expect(addDays('2026-03-01', -1)).toBe('2026-02-28')
  })

  it('считает разницу в днях', () => {
    expect(daysBetween('2026-10-06', '2026-10-09')).toBe(3)
    expect(daysBetween('2026-10-09', '2026-10-06')).toBe(-3)
  })

  it('строит диапазон дат', () => {
    expect(dateRange('2026-10-30', 3)).toEqual(['2026-10-30', '2026-10-31', '2026-11-01'])
  })

  it('берёт сегодняшнюю дату по местным часам, а не по UTC', () => {
    expect(today(new Date(2026, 0, 1, 0, 30))).toBe('2026-01-01')
  })

  it('форматирует по-русски', () => {
    expect(formatDay('2026-10-06')).toBe('6 октября')
    expect(formatRange('2026-10-06', '2026-10-08')).toBe('6–8 окт.')
    expect(formatRange('2026-09-30', '2026-10-02')).toBe('30 сент. – 2 окт.')
  })

  it('склоняет числительные', () => {
    const days = (n: number) => `${n} ${plural(n, 'день', 'дня', 'дней')}`
    expect([1, 2, 5, 11, 12, 21, 22, 25, 111].map(days)).toEqual([
      '1 день',
      '2 дня',
      '5 дней',
      '11 дней',
      '12 дней',
      '21 день',
      '22 дня',
      '25 дней',
      '111 дней',
    ])
  })
})
