import { describe, expect, it } from 'vitest'
import { kindFromTags, overpassQuery, placeFromBinding, placeFromElement, sparqlQuery } from './api'

describe('разбор ответов API', () => {
  it('определяет тип места по тегам OSM', () => {
    expect(kindFromTags('tourism', 'museum')).toBe('museum')
    expect(kindFromTags('leisure', 'park')).toBe('park')
    expect(kindFromTags('amenity', 'cafe')).toBe('food')
    expect(kindFromTags('tourism', 'viewpoint')).toBe('view')
    expect(kindFromTags('historic', 'monument')).toBe('sight')
    expect(kindFromTags('highway', 'pedestrian')).toBe('other')
  })

  it('разбирает строку ответа Wikidata', () => {
    const place = placeFromBinding({
      itemLabel: { value: 'Кул-Шариф' },
      coord: { value: 'Point(49.1052 55.7983)' },
      cls: { value: 'http://www.wikidata.org/entity/Q32815' },
      image: { value: 'http://commons.wikimedia.org/wiki/Special:FilePath/Kazan%20Kremlin.jpg' },
      article: { value: 'https://ru.wikipedia.org/wiki/%D0%9A%D1%83%D0%BB-%D0%A8%D0%B0%D1%80%D0%B8%D1%84' },
    })
    expect(place).toEqual({
      name: 'Кул-Шариф',
      kind: 'sight',
      lat: 55.7983,
      lon: 49.1052,
      image: 'Kazan Kremlin.jpg',
      wikipedia: 'ru:Кул-Шариф',
    })
  })

  it('пропускает объекты без названия на русском или английском', () => {
    expect(placeFromBinding({ itemLabel: { value: 'Q123' }, coord: { value: 'Point(1 2)' } })).toBeNull()
  })

  it('разбирает элемент Overpass (точку и полигон с центром)', () => {
    expect(placeFromElement({ lat: 1, lon: 2, tags: { name: 'Кафе', 'addr:street': 'Баумана', 'addr:housenumber': '5' } })).toEqual({
      name: 'Кафе',
      kind: 'food',
      lat: 1,
      lon: 2,
      address: 'Баумана, 5',
    })
    expect(placeFromElement({ center: { lat: 3, lon: 4 }, tags: { name: 'X', 'name:ru': 'Икс' } })?.name).toBe('Икс')
    expect(placeFromElement({ tags: { name: 'Без координат' } })).toBeNull()
  })

  it('подставляет координаты в запросы', () => {
    expect(sparqlQuery('museum', { lat: 55.7, lon: 49.1 })).toContain('Point(49.1 55.7)')
    expect(sparqlQuery('museum', { lat: 55.7, lon: 49.1 })).toContain('wd:Q33506')
    expect(overpassQuery({ lat: 55.7, lon: 49.1 })).toContain('around:1500,55.7,49.1')
  })
})
