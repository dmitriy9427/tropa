import { describe, expect, it } from 'vitest'
import { demoTrip } from './demo'
import { decodeTrip, encodeTrip, hashCode } from './share'
import { dayPlaces } from './trip'

describe('ссылка «поделиться»', () => {
  const trip = demoTrip(new Date(2026, 9, 6))

  it('кодирует и раскодирует поездку без потерь', () => {
    const back = decodeTrip(encodeTrip(trip))!
    expect(back.title).toBe(trip.title)
    expect(back.city.name).toBe('Казань')
    expect(back.days.map((d) => d.date)).toEqual(trip.days.map((d) => d.date))
    expect(back.days.map((d) => dayPlaces(back, d).map((p) => p.name))).toEqual(
      trip.days.map((d) => dayPlaces(trip, d).map((p) => p.name)),
    )
    const kul = Object.values(back.places).find((p) => p.name === 'Кул-Шариф')!
    expect(kul.note).toBe('Вход бесплатный, бахилы на входе')
    expect(kul.image).toContain('Qolsharif')
  })

  it('выдаёт новые id, чтобы копия не конфликтовала с оригиналом', () => {
    const back = decodeTrip(encodeTrip(trip))!
    expect(back.id).not.toBe(trip.id)
    expect(Object.keys(back.places).some((id) => trip.places[id])).toBe(false)
  })

  it('укладывается в разумную длину адреса', () => {
    expect(encodeTrip(trip).length).toBeLessThan(3000)
  })

  it('возвращает null на испорченных данных', () => {
    expect(decodeTrip('мусор')).toBeNull()
    expect(decodeTrip(encodeTrip(trip).slice(0, 50))).toBeNull()
  })

  it('хеш стабилен и различает строки', () => {
    expect(hashCode('abc')).toBe(hashCode('abc'))
    expect(hashCode('abc')).not.toBe(hashCode('abd'))
  })
})
