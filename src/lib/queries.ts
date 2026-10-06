'use client'

// Хуки TanStack Query. Ключ запроса — его «адрес» в кеше: одинаковый ключ
// из разных компонентов = один сетевой запрос и общий результат.
// Отмена: TanStack Query передаёт signal, и при смене ключа (пользователь
// печатает дальше) старый fetch прерывается.

import { useQuery } from '@tanstack/react-query'
import { forecast, nearbyPlaces, searchCities, searchPlaces, wikiSummary, type Category } from './api'
import type { City } from './types'

const HOUR = 60 * 60 * 1000

export function useCitySearch(query: string) {
  const q = query.trim()
  return useQuery({
    queryKey: ['cities', q.toLowerCase()],
    queryFn: ({ signal }) => searchCities(q, signal),
    enabled: q.length >= 2,
    staleTime: 24 * HOUR,
    // Пока грузится новый ответ, показываем предыдущий — список не «мигает».
    placeholderData: (prev) => prev,
  })
}

export function usePlaceSearch(query: string, city: City) {
  const q = query.trim()
  return useQuery({
    queryKey: ['places', city.lat, city.lon, q.toLowerCase()],
    queryFn: ({ signal }) => searchPlaces(q, city, signal),
    enabled: q.length >= 3,
    staleTime: HOUR,
    placeholderData: (prev) => prev,
  })
}

export function useNearby(category: Category, city: City) {
  return useQuery({
    queryKey: ['nearby', category, city.lat, city.lon],
    queryFn: ({ signal }) => nearbyPlaces(category, city, signal),
    staleTime: 24 * HOUR,
    retry: 1,
  })
}

export function useForecast(city: City) {
  return useQuery({
    queryKey: ['forecast', city.lat, city.lon],
    queryFn: ({ signal }) => forecast(city, signal),
    staleTime: HOUR,
  })
}

export function useWiki(tag: string | undefined) {
  return useQuery({
    queryKey: ['wiki', tag],
    queryFn: ({ signal }) => wikiSummary(tag!, signal),
    enabled: !!tag,
    staleTime: 24 * HOUR,
    retry: false,
  })
}
