// Ссылка «поделиться»: вся поездка помещается в адрес страницы.
// Сервера нет, поэтому данные едут в самом URL: сжимаем JSON через lz-string
// (compressToEncodedURIComponent даёт строку, безопасную для адреса).
// Чтобы ссылка была короче, вместо объектов пишем массивы-кортежи.

import { compressToEncodedURIComponent, decompressFromEncodedURIComponent } from 'lz-string'
import { addDays } from './dates'
import { MAX_DAYS, uid } from './trip'
import type { Place, PlaceKind, Trip } from './types'

const VERSION = 1
const KINDS: PlaceKind[] = ['sight', 'museum', 'view', 'park', 'food', 'other']

type PackedPlace = [
  name: string,
  kind: number,
  lat: number,
  lon: number,
  duration: number,
  note?: string,
  wiki?: string,
  image?: string,
]
type Packed = {
  v: number
  t: string
  c: [name: string, country: string, lat: number, lon: number, timezone: string]
  s: string
  d: number[][]
  i: number[]
  p: PackedPlace[]
}

const round = (n: number) => Math.round(n * 1e5) / 1e5

export function encodeTrip(trip: Trip): string {
  const ids = Object.keys(trip.places)
  const index = new Map(ids.map((id, i) => [id, i]))
  const packPlace = (p: Place): PackedPlace => {
    const row: PackedPlace = [p.name, KINDS.indexOf(p.kind), round(p.lat), round(p.lon), p.durationMin]
    // Хвостовые поля пишем, только если они есть: пустые строки тоже удлиняют ссылку.
    const tail = [p.note ?? '', p.wikipedia ?? '', p.image ?? '']
    while (tail.length && !tail.at(-1)) tail.pop()
    row.push(...tail)
    return row
  }
  const packed: Packed = {
    v: VERSION,
    t: trip.title,
    c: [trip.city.name, trip.city.country, round(trip.city.lat), round(trip.city.lon), trip.city.timezone],
    s: trip.days[0].date,
    d: trip.days.map((d) => d.placeIds.map((id) => index.get(id)!).filter((i) => i !== undefined)),
    i: trip.ideaIds.map((id) => index.get(id)!).filter((i) => i !== undefined),
    p: ids.map((id) => packPlace(trip.places[id])),
  }
  return compressToEncodedURIComponent(JSON.stringify(packed))
}

const isNum = (x: unknown): x is number => typeof x === 'number' && Number.isFinite(x)
const isStr = (x: unknown): x is string => typeof x === 'string'

/** Разобрать ссылку. Любые испорченные данные → null, а не исключение. */
export function decodeTrip(code: string, now = Date.now()): Trip | null {
  try {
    const json = decompressFromEncodedURIComponent(code)
    if (!json) return null
    const data = JSON.parse(json) as Packed
    if (data.v !== VERSION || !isStr(data.t) || !Array.isArray(data.p) || !Array.isArray(data.d) || !data.d.length) return null
    const [cName, country, lat, lon, timezone] = data.c
    if (!isStr(cName) || !isNum(lat) || !isNum(lon) || !/^\d{4}-\d{2}-\d{2}$/.test(data.s)) return null

    const ids = data.p.map(() => uid())
    const places: Record<string, Place> = {}
    data.p.forEach((row, i) => {
      const [name, kind, pLat, pLon, duration, note, wiki, image] = row
      if (!isStr(name) || !isNum(pLat) || !isNum(pLon)) return
      places[ids[i]] = {
        id: ids[i],
        name: name.slice(0, 120),
        kind: KINDS[kind] ?? 'other',
        lat: pLat,
        lon: pLon,
        durationMin: isNum(duration) ? duration : 60,
        ...(note ? { note: String(note).slice(0, 500) } : {}),
        ...(wiki ? { wikipedia: String(wiki) } : {}),
        ...(image ? { image: String(image) } : {}),
      }
    })
    const pick = (list: unknown) =>
      (Array.isArray(list) ? list : []).map((i) => ids[i as number]).filter((id) => id && places[id])

    return {
      id: uid(),
      title: data.t.slice(0, 60),
      city: { name: cName, country: isStr(country) ? country : '', lat, lon, timezone: isStr(timezone) ? timezone : 'auto' },
      ideaIds: pick(data.i),
      days: data.d.slice(0, MAX_DAYS).map((list, n) => ({ id: uid(), date: addDays(data.s, n), placeIds: pick(list) })),
      places,
      createdAt: now,
      updatedAt: now,
    }
  } catch {
    return null
  }
}

/** Короткий хеш строки (cyrb53) — отпечаток ссылки, чтобы узнать её при повторном открытии. */
export function hashCode(str: string): string {
  let h1 = 0xdeadbeef
  let h2 = 0x41c6ce57
  for (let i = 0; i < str.length; i++) {
    const ch = str.charCodeAt(i)
    h1 = Math.imul(h1 ^ ch, 2654435761)
    h2 = Math.imul(h2 ^ ch, 1597334677)
  }
  h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909)
  h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909)
  return (4294967296 * (2097151 & h2) + (h1 >>> 0)).toString(36)
}

/** Полная ссылка на поездку для копирования. */
export function shareUrl(trip: Trip): string {
  const base = process.env.NEXT_PUBLIC_BASE_PATH ?? ''
  return `${location.origin}${base}/trip/?s=${encodeTrip(trip)}`
}
