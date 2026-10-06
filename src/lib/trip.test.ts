import { describe, expect, it } from 'vitest'
import { KAZAN } from './demo'
import {
  addDay,
  addPlace,
  containerOf,
  createTrip,
  MAX_DAYS,
  movePlace,
  removeDay,
  removePlace,
  renameTrip,
  setStartDate,
  updatePlace,
} from './trip'
import type { PlaceDraft, Trip } from './types'

const draft = (name: string, lat = 55.79, lon = 49.1): PlaceDraft => ({ name, kind: 'sight', lat, lon })

/** Поездка на 2 дня: A, B в идеях; C в первом дне. */
function sample(): Trip {
  let trip = createTrip(KAZAN, '2026-10-10', 2)
  trip = addPlace(trip, draft('A', 1, 1))
  trip = addPlace(trip, draft('B', 2, 2))
  trip = addPlace(trip, draft('C', 3, 3), `day:${trip.days[0].id}`)
  return trip
}
const names = (trip: Trip, ids: string[]) => ids.map((id) => trip.places[id].name)

describe('createTrip', () => {
  it('создаёт дни подряд с даты начала', () => {
    const trip = createTrip(KAZAN, '2026-10-30', 3)
    expect(trip.days.map((d) => d.date)).toEqual(['2026-10-30', '2026-10-31', '2026-11-01'])
    expect(trip.title).toBe('Казань')
  })

  it('ограничивает число дней', () => {
    expect(createTrip(KAZAN, '2026-10-01', 99).days).toHaveLength(MAX_DAYS)
    expect(createTrip(KAZAN, '2026-10-01', 0).days).toHaveLength(1)
  })
})

describe('addPlace / removePlace', () => {
  it('кладёт место в идеи или в день', () => {
    const trip = sample()
    expect(names(trip, trip.ideaIds)).toEqual(['A', 'B'])
    expect(names(trip, trip.days[0].placeIds)).toEqual(['C'])
  })

  it('не добавляет место с теми же координатами дважды', () => {
    const trip = sample()
    expect(addPlace(trip, draft('A снова', 1, 1))).toBe(trip)
  })

  it('ставит время по типу места, если не задано', () => {
    const trip = addPlace(createTrip(KAZAN, '2026-10-10', 1), { ...draft('Музей'), kind: 'museum' })
    expect(Object.values(trip.places)[0].durationMin).toBe(120)
  })

  it('удаляет место отовсюду', () => {
    const trip = sample()
    const c = trip.days[0].placeIds[0]
    const next = removePlace(trip, c)
    expect(next.places[c]).toBeUndefined()
    expect(next.days[0].placeIds).toEqual([])
  })
})

describe('movePlace', () => {
  it('переносит из идей в день на нужную позицию', () => {
    const trip = sample()
    const [a] = trip.ideaIds
    const next = movePlace(trip, a, `day:${trip.days[0].id}`, 0)
    expect(names(next, next.ideaIds)).toEqual(['B'])
    expect(names(next, next.days[0].placeIds)).toEqual(['A', 'C'])
    expect(containerOf(next, a)).toBe(`day:${trip.days[0].id}`)
  })

  it('сортирует внутри списка', () => {
    const trip = sample()
    const [a] = trip.ideaIds
    const next = movePlace(trip, a, 'ideas', 5)
    expect(names(next, next.ideaIds)).toEqual(['B', 'A'])
  })

  it('не теряет и не дублирует места', () => {
    let trip = sample()
    const ids = Object.keys(trip.places)
    trip = movePlace(trip, ids[0], `day:${trip.days[1].id}`, 0)
    trip = movePlace(trip, ids[2], `day:${trip.days[1].id}`, 1)
    trip = movePlace(trip, ids[0], 'ideas', 0)
    const all = [...trip.ideaIds, ...trip.days.flatMap((d) => d.placeIds)]
    expect(all.sort()).toEqual([...ids].sort())
  })
})

describe('дни', () => {
  it('добавляет день следующей датой', () => {
    const trip = addDay(sample())
    expect(trip.days.map((d) => d.date)).toEqual(['2026-10-10', '2026-10-11', '2026-10-12'])
  })

  it('при удалении дня возвращает его места в идеи и сдвигает даты', () => {
    const trip = addDay(sample())
    const next = removeDay(trip, trip.days[0].id)
    expect(next.days.map((d) => d.date)).toEqual(['2026-10-10', '2026-10-11'])
    expect(names(next, next.ideaIds)).toEqual(['A', 'B', 'C'])
  })

  it('не удаляет последний день', () => {
    const trip = createTrip(KAZAN, '2026-10-10', 1)
    expect(removeDay(trip, trip.days[0].id)).toBe(trip)
  })

  it('сдвигает все даты при смене начала', () => {
    const next = setStartDate(sample(), '2026-12-31')
    expect(next.days.map((d) => d.date)).toEqual(['2026-12-31', '2027-01-01'])
  })
})

describe('прочее', () => {
  it('переименовывает, игнорируя пустое название', () => {
    const trip = sample()
    expect(renameTrip(trip, '  Осень  ').title).toBe('Осень')
    expect(renameTrip(trip, '   ')).toBe(trip)
  })

  it('меняет заметку и время места', () => {
    const trip = sample()
    const id = trip.ideaIds[0]
    const next = updatePlace(trip, id, { note: 'Билеты', durationMin: 30 })
    expect(next.places[id]).toMatchObject({ note: 'Билеты', durationMin: 30 })
  })
})
