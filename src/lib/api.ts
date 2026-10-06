// Запросы к открытым API. Все бесплатные, без ключей и с CORS — их можно
// вызывать прямо из браузера, сервер-посредник не нужен.
//
//  - Open-Meteo Geocoding — поиск городов (умеет русский язык);
//  - Photon (komoot) — поиск мест внутри города по названию;
//  - Wikidata — популярные достопримечательности рядом с городом (с фото);
//  - Overpass — кафе и рестораны из OpenStreetMap;
//  - Open-Meteo Forecast — прогноз погоды на 16 дней;
//  - Википедия REST — фото и короткое описание места.
//
// Кешированием, повторами и отменой запросов занимается TanStack Query
// (см. hooks/queries.ts), здесь только «сходить и разобрать ответ».

import type { City, PlaceDraft, PlaceKind } from './types'

async function getJSON<T>(url: string, signal?: AbortSignal): Promise<T> {
  const res = await fetch(url, { signal })
  if (!res.ok) throw new Error(`${res.status} ${url}`)
  return res.json() as Promise<T>
}

// --- города -------------------------------------------------------------------

type GeoResult = {
  name: string
  latitude: number
  longitude: number
  country?: string
  admin1?: string
  timezone?: string
  population?: number
}

export async function searchCities(query: string, signal?: AbortSignal): Promise<City[]> {
  const url = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(query)}&count=6&language=ru`
  const data = await getJSON<{ results?: GeoResult[] }>(url, signal)
  return (data.results ?? []).map((r) => ({
    name: r.name,
    country: r.country ?? '',
    region: r.admin1,
    lat: r.latitude,
    lon: r.longitude,
    timezone: r.timezone ?? 'auto',
  }))
}

// --- места по названию ----------------------------------------------------------

type PhotonFeature = {
  geometry: { coordinates: [number, number] }
  properties: {
    name?: string
    osm_key?: string
    osm_value?: string
    street?: string
    housenumber?: string
    city?: string
  }
}

/** Тип места по тегам OpenStreetMap (ключ + значение). */
export function kindFromTags(key = '', value = ''): PlaceKind {
  if (key === 'tourism' && (value === 'museum' || value === 'gallery')) return 'museum'
  if (value === 'viewpoint') return 'view'
  if (key === 'leisure' && (value === 'park' || value === 'garden')) return 'park'
  if (key === 'amenity' && ['restaurant', 'cafe', 'bar', 'pub', 'fast_food', 'ice_cream'].includes(value)) return 'food'
  if (key === 'tourism' || key === 'historic') return 'sight'
  return 'other'
}

export async function searchPlaces(query: string, near: City, signal?: AbortSignal): Promise<PlaceDraft[]> {
  // lat/lon не ограничивают поиск, а поднимают выше то, что ближе к городу.
  const url =
    `https://photon.komoot.io/api/?q=${encodeURIComponent(query)}` +
    `&lat=${near.lat}&lon=${near.lon}&limit=8&location_bias_scale=0.5`
  const data = await getJSON<{ features: PhotonFeature[] }>(url, signal)
  return data.features
    .filter((f) => f.properties.name)
    .map((f) => {
      const p = f.properties
      const address = [p.street, p.housenumber].filter(Boolean).join(', ') || p.city
      return {
        name: p.name!,
        kind: kindFromTags(p.osm_key, p.osm_value),
        lat: f.geometry.coordinates[1],
        lon: f.geometry.coordinates[0],
        ...(address ? { address } : {}),
      }
    })
}

// --- подборка «что посмотреть» --------------------------------------------------

export type Category = 'top' | 'museum' | 'park' | 'food'

export const CATEGORIES: { id: Category; label: string }[] = [
  { id: 'top', label: 'Главное' },
  { id: 'museum', label: 'Музеи' },
  { id: 'park', label: 'Парки' },
  { id: 'food', label: 'Кафе' },
]

// Достопримечательности берём из Wikidata — базы знаний Википедии.
// Популярность места = число языковых разделов Википедии со статьёй о нём
// (wikibase:sitelinks): у Казанского кремля их ~50, у безымянного сквера 0.
// Классы (wdt:P31) перечислены явно: обход иерархии подклассов (P279*) по
// всей базе слишком медленный для запроса из браузера.
const MUSEUMS = ['Q33506', 'Q207694', 'Q17431399', 'Q1007870', 'Q2087181']
const PARKS = ['Q22698', 'Q1107656', 'Q43501']
const SIGHTS = [
  'Q570116', 'Q9259', 'Q2319498', 'Q358', 'Q4989906', 'Q32815', 'Q16970', 'Q2977', 'Q24354', 'Q12280',
  'Q158555', 'Q12518', 'Q16560', 'Q57821', 'Q23413', 'Q44613', 'Q179700', 'Q575759', 'Q5003624', 'Q174782',
  'Q153562', 'Q1060829', 'Q15243209', 'Q1081138', 'Q839954',
]
const CLASSES: Record<Exclude<Category, 'food'>, string[]> = {
  top: [...SIGHTS, ...MUSEUMS, ...PARKS],
  museum: [...MUSEUMS, 'Q1081138'],
  park: PARKS,
}

export function sparqlQuery(category: Exclude<Category, 'food'>, city: Pick<City, 'lat' | 'lon'>, radiusKm = 10): string {
  const values = CLASSES[category].map((q) => `wd:${q}`).join(' ')
  return `SELECT ?item ?itemLabel ?links ?coord (SAMPLE(?c) AS ?cls) (SAMPLE(?img) AS ?image) (SAMPLE(?art) AS ?article) WHERE {
  SERVICE wikibase:around {
    ?item wdt:P625 ?coord.
    bd:serviceParam wikibase:center "Point(${city.lon} ${city.lat})"^^geo:wktLiteral; wikibase:radius "${radiusKm}".
  }
  VALUES ?c { ${values} }
  ?item wdt:P31 ?c; wikibase:sitelinks ?links.
  OPTIONAL { ?item wdt:P18 ?img }
  OPTIONAL { ?art schema:about ?item; schema:isPartOf <https://ru.wikipedia.org/>. }
  SERVICE wikibase:label { bd:serviceParam wikibase:language "ru,en". }
} GROUP BY ?item ?itemLabel ?links ?coord ORDER BY DESC(?links) LIMIT 40`
}

type Binding = Record<string, { value: string } | undefined>

/** «Point(49.1 55.7)» → координаты. */
function parsePoint(wkt: string): { lat: number; lon: number } | null {
  const m = /Point\(([-\d.e]+) ([-\d.e]+)\)/.exec(wkt)
  return m ? { lon: Number(m[1]), lat: Number(m[2]) } : null
}

const lastSegment = (url: string) => decodeURIComponent(url.slice(url.lastIndexOf('/') + 1))

export function placeFromBinding(b: Binding): PlaceDraft | null {
  const point = b.coord && parsePoint(b.coord.value)
  const name = b.itemLabel?.value
  // Без русского или английского названия label = Q-номер — такое не показываем.
  if (!point || !name || /^Q\d+$/.test(name)) return null
  const cls = b.cls ? lastSegment(b.cls.value) : ''
  const kind: PlaceKind = MUSEUMS.includes(cls) || cls === 'Q1081138' ? 'museum' : PARKS.includes(cls) ? 'park' : 'sight'
  return {
    name,
    kind,
    ...point,
    ...(b.image ? { image: lastSegment(b.image.value) } : {}),
    ...(b.article ? { wikipedia: `ru:${lastSegment(b.article.value).replaceAll('_', ' ')}` } : {}),
  }
}

async function wikidataPlaces(category: Exclude<Category, 'food'>, city: City, signal?: AbortSignal) {
  const url = `https://query.wikidata.org/sparql?format=json&query=${encodeURIComponent(sparqlQuery(category, city))}`
  const data = await getJSON<{ results: { bindings: Binding[] } }>(url, signal)
  const seen = new Set<string>()
  return data.results.bindings
    .map(placeFromBinding)
    .filter((p): p is PlaceDraft => {
      if (!p || seen.has(p.name)) return false
      seen.add(p.name)
      return true
    })
}

// Кафе в Wikidata почти нет — их берём из OpenStreetMap через Overpass.
// Публичные серверы Overpass бывают перегружены, поэтому пробуем по очереди
// и не ждём каждый дольше 12 секунд.
const OVERPASS = [
  'https://overpass-api.de/api/interpreter',
  'https://maps.mail.ru/osm/tools/overpass/api/interpreter',
  'https://overpass.kumi.systems/api/interpreter',
]

type OverpassElement = {
  lat?: number
  lon?: number
  center?: { lat: number; lon: number }
  tags: Record<string, string>
}

export function overpassQuery(city: Pick<City, 'lat' | 'lon'>): string {
  return `[out:json][timeout:15];nwr["amenity"~"^(restaurant|cafe)$"]["name"]["cuisine"](around:1500,${city.lat},${city.lon});out center tags 60;`
}

export function placeFromElement(el: OverpassElement): PlaceDraft | null {
  const point = el.center ?? (el.lat !== undefined && el.lon !== undefined ? { lat: el.lat, lon: el.lon } : null)
  const name = el.tags['name:ru'] ?? el.tags.name
  if (!point || !name) return null
  const address = [el.tags['addr:street'], el.tags['addr:housenumber']].filter(Boolean).join(', ')
  return { name, kind: 'food', ...point, ...(address ? { address } : {}) }
}

async function overpassFood(city: City, signal?: AbortSignal): Promise<PlaceDraft[]> {
  const query = `data=${encodeURIComponent(overpassQuery(city))}`
  let lastError: unknown
  for (const url of OVERPASS) {
    const timeout = AbortSignal.timeout(12_000)
    try {
      const res = await fetch(`${url}?${query}`, { signal: signal ? AbortSignal.any([signal, timeout]) : timeout })
      if (!res.ok) throw new Error(`${res.status}`)
      const data = (await res.json()) as { elements: OverpassElement[] }
      return data.elements
        .map(placeFromElement)
        .filter((p): p is PlaceDraft => !!p)
        .sort((a, b) => dist2(a, city) - dist2(b, city))
        .slice(0, 30)
    } catch (error) {
      if (signal?.aborted) throw error
      lastError = error
    }
  }
  throw lastError
}

export function nearbyPlaces(category: Category, city: City, signal?: AbortSignal): Promise<PlaceDraft[]> {
  return category === 'food' ? overpassFood(city, signal) : wikidataPlaces(category, city, signal)
}

const dist2 = (a: { lat: number; lon: number }, b: { lat: number; lon: number }) =>
  (a.lat - b.lat) ** 2 + (a.lon - b.lon) ** 2

/** Превью картинки с Wikimedia Commons по имени файла. */
export function commonsThumb(file: string, width = 480): string {
  return `https://commons.wikimedia.org/wiki/Special:FilePath/${encodeURIComponent(file)}?width=${width}`
}

// --- погода --------------------------------------------------------------------

export type DayWeather = { code: number; max: number; min: number; rain: number }

export const FORECAST_DAYS = 16

export async function forecast(city: City, signal?: AbortSignal): Promise<Record<string, DayWeather>> {
  const url =
    `https://api.open-meteo.com/v1/forecast?latitude=${city.lat}&longitude=${city.lon}` +
    `&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max` +
    `&forecast_days=${FORECAST_DAYS}&timezone=${encodeURIComponent(city.timezone)}`
  const data = await getJSON<{
    daily: {
      time: string[]
      weather_code: number[]
      temperature_2m_max: number[]
      temperature_2m_min: number[]
      precipitation_probability_max: (number | null)[]
    }
  }>(url, signal)
  const d = data.daily
  return Object.fromEntries(
    d.time.map((date, i) => [
      date,
      {
        code: d.weather_code[i],
        max: Math.round(d.temperature_2m_max[i]),
        min: Math.round(d.temperature_2m_min[i]),
        rain: d.precipitation_probability_max[i] ?? 0,
      },
    ]),
  )
}

// --- Википедия -----------------------------------------------------------------

export type WikiSummary = { title: string; extract: string; image?: string; url: string }

/** tag — значение тега wikipedia из OSM: «ru:Казанский кремль». */
export async function wikiSummary(tag: string, signal?: AbortSignal): Promise<WikiSummary | null> {
  const [lang, ...rest] = tag.includes(':') ? tag.split(':') : ['ru', tag]
  const title = rest.join(':')
  if (!/^[a-z-]{2,12}$/.test(lang) || !title) return null
  const url = `https://${lang}.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(title.replaceAll(' ', '_'))}`
  const data = await getJSON<{
    title: string
    extract: string
    thumbnail?: { source: string }
    content_urls?: { desktop: { page: string } }
  }>(url, signal)
  return {
    title: data.title,
    extract: data.extract,
    image: data.thumbnail?.source,
    url: data.content_urls?.desktop.page ?? `https://${lang}.wikipedia.org/wiki/${encodeURIComponent(title)}`,
  }
}
