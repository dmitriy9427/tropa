// Расстояния по прямой между точками маршрута. Для прогулки по городу этого
// хватает: настоящая пешеходная дорога обычно длиннее на 20–30 %, это учтено
// в коэффициенте WALK_DETOUR.

export type LngLat = { lat: number; lon: number }

const EARTH_KM = 6371
const WALK_KMH = 4.5
const WALK_DETOUR = 1.25

const rad = (deg: number) => (deg * Math.PI) / 180

/** Расстояние по поверхности Земли (формула гаверсинусов), км. */
export function distanceKm(a: LngLat, b: LngLat): number {
  const dLat = rad(b.lat - a.lat)
  const dLon = rad(b.lon - a.lon)
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.sin(dLon / 2) ** 2
  return 2 * EARTH_KM * Math.asin(Math.sqrt(h))
}

/** Длина маршрута через все точки по порядку, км. */
export function routeKm(points: LngLat[]): number {
  let total = 0
  for (let i = 1; i < points.length; i++) total += distanceKm(points[i - 1], points[i])
  return total
}

/** Сколько минут идти пешком с учётом петляния улиц. */
export function walkMinutes(km: number): number {
  return Math.round(((km * WALK_DETOUR) / WALK_KMH) * 60)
}

/** Рамка вокруг точек: [[minLon, minLat], [maxLon, maxLat]] — формат MapLibre. */
export function bounds(points: LngLat[]): [[number, number], [number, number]] | null {
  if (points.length === 0) return null
  let minLon = Infinity
  let minLat = Infinity
  let maxLon = -Infinity
  let maxLat = -Infinity
  for (const p of points) {
    minLon = Math.min(minLon, p.lon)
    minLat = Math.min(minLat, p.lat)
    maxLon = Math.max(maxLon, p.lon)
    maxLat = Math.max(maxLat, p.lat)
  }
  return [
    [minLon, minLat],
    [maxLon, maxLat],
  ]
}

export function formatKm(km: number): string {
  if (km < 1) return `${Math.round(km * 1000)} м`
  return `${km.toFixed(km < 10 ? 1 : 0).replace('.', ',')} км`
}

export function formatMinutes(min: number): string {
  if (min < 60) return `${min} мин`
  const h = Math.floor(min / 60)
  const m = min % 60
  return m ? `${h} ч ${m} мин` : `${h} ч`
}
