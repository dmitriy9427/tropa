// Модель данных поездки. Всё, что лежит в Trip, сохраняется в localStorage
// и кодируется в ссылку «поделиться», поэтому только простые JSON-значения.

export type City = {
  name: string
  country: string
  region?: string
  lat: number
  lon: number
  timezone: string
}

export type PlaceKind = 'sight' | 'museum' | 'view' | 'park' | 'food' | 'other'

export type Place = {
  id: string
  name: string
  kind: PlaceKind
  lat: number
  lon: number
  address?: string
  note?: string
  /** Сколько времени закладываем на место, минуты. */
  durationMin: number
  /** «ru:Казанский кремль» — по нему подтягиваем фото и описание из Википедии. */
  wikipedia?: string
  /** Имя файла фото на Wikimedia Commons: «Kazan Kremlin.jpg». */
  image?: string
}

export type Day = {
  id: string
  /** Локальная дата поездки, YYYY-MM-DD (без часового пояса). */
  date: string
  placeIds: string[]
}

export type Trip = {
  id: string
  title: string
  city: City
  /** «Идеи» — места, которые ещё не разложены по дням. */
  ideaIds: string[]
  days: Day[]
  places: Record<string, Place>
  createdAt: number
  updatedAt: number
  /** Хеш ссылки, из которой поездку импортировали: повторное открытие не создаст копию. */
  importedFrom?: string
}

/** Куда можно положить место: в идеи или в конкретный день. */
export type ContainerId = 'ideas' | `day:${string}`

/** Найденное место до добавления в поездку — без id и времени. */
export type PlaceDraft = Omit<Place, 'id' | 'durationMin'> & { durationMin?: number }
