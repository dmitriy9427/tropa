import { describe, expect, it } from 'vitest'
import { bounds, distanceKm, formatKm, formatMinutes, routeKm, walkMinutes } from './geo'

const kremlin = { lat: 55.79744, lon: 49.10724 }
const bauman = { lat: 55.78887, lon: 49.11859 }

describe('geo', () => {
  it('считает расстояние по поверхности Земли', () => {
    // Москва — Санкт-Петербург по прямой ≈ 634 км.
    expect(distanceKm({ lat: 55.7558, lon: 37.6173 }, { lat: 59.9343, lon: 30.3351 })).toBeCloseTo(634, -1)
    expect(distanceKm(kremlin, kremlin)).toBe(0)
  })

  it('суммирует маршрут по порядку точек', () => {
    const one = distanceKm(kremlin, bauman)
    expect(routeKm([kremlin, bauman, kremlin])).toBeCloseTo(one * 2)
    expect(routeKm([kremlin])).toBe(0)
  })

  it('переводит километры в минуты пешком с запасом на петляние', () => {
    expect(walkMinutes(4.5)).toBe(75) // 4,5 км × 1,25 / 4,5 км/ч = 1 ч 15 мин
  })

  it('строит рамку вокруг точек', () => {
    expect(bounds([kremlin, bauman])).toEqual([
      [49.10724, 55.78887],
      [49.11859, 55.79744],
    ])
    expect(bounds([])).toBeNull()
  })

  it('форматирует расстояние и время', () => {
    expect(formatKm(0.42)).toBe('420 м')
    expect(formatKm(2.345)).toBe('2,3 км')
    expect(formatKm(12.6)).toBe('13 км')
    expect(formatMinutes(45)).toBe('45 мин')
    expect(formatMinutes(120)).toBe('2 ч')
    expect(formatMinutes(135)).toBe('2 ч 15 мин')
  })
})
