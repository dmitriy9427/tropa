// Чистые функции над поездкой: получают Trip, возвращают новый Trip.
// Хранилище (store/trips.ts) только вызывает их, поэтому вся логика
// раскладки мест проверяется обычными тестами без React.

import { addDays, dateRange, daysBetween } from './dates'
import type { City, ContainerId, Day, Place, PlaceDraft, Trip } from './types'

export const MAX_DAYS = 14
const DEFAULT_DURATION: Record<Place['kind'], number> = {
  sight: 60,
  museum: 120,
  view: 30,
  park: 60,
  food: 60,
  other: 45,
}

export function uid(): string {
  return Math.random().toString(36).slice(2, 10)
}

export function createTrip(city: City, start: string, dayCount: number, now = Date.now()): Trip {
  const count = Math.min(Math.max(dayCount, 1), MAX_DAYS)
  return {
    id: uid(),
    title: city.name,
    city,
    ideaIds: [],
    days: dateRange(start, count).map((date) => ({ id: uid(), date, placeIds: [] })),
    places: {},
    createdAt: now,
    updatedAt: now,
  }
}

const touch = (trip: Trip): Trip => ({ ...trip, updatedAt: Date.now() })

export const dayContainer = (day: Day): ContainerId => `day:${day.id}`

/** Список id мест в контейнере («Идеи» или день). */
export function itemsOf(trip: Trip, container: ContainerId): string[] {
  if (container === 'ideas') return trip.ideaIds
  return trip.days.find((d) => dayContainer(d) === container)?.placeIds ?? []
}

/** В каком контейнере сейчас лежит место. */
export function containerOf(trip: Trip, placeId: string): ContainerId | null {
  if (trip.ideaIds.includes(placeId)) return 'ideas'
  const day = trip.days.find((d) => d.placeIds.includes(placeId))
  return day ? dayContainer(day) : null
}

function setItems(trip: Trip, container: ContainerId, ids: string[]): Trip {
  if (container === 'ideas') return { ...trip, ideaIds: ids }
  return {
    ...trip,
    days: trip.days.map((d) => (dayContainer(d) === container ? { ...d, placeIds: ids } : d)),
  }
}

/** Одно и то же место (те же координаты) второй раз не добавляем. */
export function findDuplicate(trip: Trip, draft: PlaceDraft): Place | undefined {
  return Object.values(trip.places).find(
    (p) => Math.abs(p.lat - draft.lat) < 1e-5 && Math.abs(p.lon - draft.lon) < 1e-5,
  )
}

export function addPlace(trip: Trip, draft: PlaceDraft, to: ContainerId = 'ideas'): Trip {
  if (findDuplicate(trip, draft)) return trip
  const place: Place = { durationMin: DEFAULT_DURATION[draft.kind], ...draft, id: uid() }
  const next = { ...trip, places: { ...trip.places, [place.id]: place } }
  return touch(setItems(next, to, [...itemsOf(next, to), place.id]))
}

export function removePlace(trip: Trip, placeId: string): Trip {
  const places = { ...trip.places }
  delete places[placeId]
  return touch({
    ...trip,
    places,
    ideaIds: trip.ideaIds.filter((id) => id !== placeId),
    days: trip.days.map((d) => ({ ...d, placeIds: d.placeIds.filter((id) => id !== placeId) })),
  })
}

export function updatePlace(trip: Trip, placeId: string, patch: Partial<Pick<Place, 'note' | 'durationMin'>>): Trip {
  const place = trip.places[placeId]
  if (!place) return trip
  return touch({ ...trip, places: { ...trip.places, [placeId]: { ...place, ...patch } } })
}

/**
 * Переложить место в контейнер `to` на позицию `index`.
 * Работает и внутри одного списка (сортировка), и между днями.
 */
export function movePlace(trip: Trip, placeId: string, to: ContainerId, index: number): Trip {
  const from = containerOf(trip, placeId)
  if (!from) return trip
  const source = itemsOf(trip, from).filter((id) => id !== placeId)
  let next = setItems(trip, from, source)
  const target = from === to ? source : [...itemsOf(next, to)]
  const at = Math.max(0, Math.min(index, target.length))
  target.splice(at, 0, placeId)
  next = setItems(next, to, target)
  return touch(next)
}

/** Добавить день в конец поездки. */
export function addDay(trip: Trip): Trip {
  if (trip.days.length >= MAX_DAYS) return trip
  const last = trip.days.at(-1)
  const date = last ? addDays(last.date, 1) : new Date().toISOString().slice(0, 10)
  return touch({ ...trip, days: [...trip.days, { id: uid(), date, placeIds: [] }] })
}

/** Удалить день: его места не пропадают, а возвращаются в «Идеи». Даты остальных дней сдвигаются. */
export function removeDay(trip: Trip, dayId: string): Trip {
  if (trip.days.length <= 1) return trip
  const day = trip.days.find((d) => d.id === dayId)
  if (!day) return trip
  const start = trip.days[0].date
  const days = trip.days.filter((d) => d.id !== dayId).map((d, i) => ({ ...d, date: addDays(start, i) }))
  return touch({ ...trip, days, ideaIds: [...trip.ideaIds, ...day.placeIds] })
}

/** Сменить дату начала: все дни сдвигаются вместе с местами. */
export function setStartDate(trip: Trip, start: string): Trip {
  if (!trip.days.length || trip.days[0].date === start) return trip
  const shift = daysBetween(trip.days[0].date, start)
  return touch({ ...trip, days: trip.days.map((d) => ({ ...d, date: addDays(d.date, shift) })) })
}

export function renameTrip(trip: Trip, title: string): Trip {
  const clean = title.trim().slice(0, 60)
  return clean ? touch({ ...trip, title: clean }) : trip
}

/** Места дня по порядку (пропуская битые id). */
export function dayPlaces(trip: Trip, day: Day): Place[] {
  return day.placeIds.map((id) => trip.places[id]).filter(Boolean)
}

export function tripRange(trip: Trip): { start: string; end: string } {
  return { start: trip.days[0]?.date ?? '', end: trip.days.at(-1)?.date ?? '' }
}
