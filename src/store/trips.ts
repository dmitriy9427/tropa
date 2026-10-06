// Хранилище поездок на Zustand. Состояние — словарь поездок, действия —
// обёртки над чистыми функциями из lib/trip.ts.
//
// persist сохраняет поездки в localStorage. Тонкость Next.js: страницы
// пререндерятся на этапе сборки, где localStorage нет. Если читать его сразу,
// HTML с сервера (пустой список) не совпадёт с первым рендером в браузере
// (список из хранилища) — React выдаст ошибку гидратации. Поэтому
// skipHydration: true, а данные подгружаем после монтирования
// (см. useHydrateTrips) и до этого показываем заглушку.

import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'
import * as T from '@/lib/trip'
import type { City, ContainerId, Place, PlaceDraft, Trip } from '@/lib/types'

type TripsState = {
  trips: Record<string, Trip>
  hydrated: boolean
  create: (city: City, start: string, days: number) => string
  save: (trip: Trip) => string
  remove: (tripId: string) => void
  rename: (tripId: string, title: string) => void
  setStart: (tripId: string, date: string) => void
  addDay: (tripId: string) => void
  removeDay: (tripId: string, dayId: string) => void
  addPlace: (tripId: string, draft: PlaceDraft, to?: ContainerId) => void
  removePlace: (tripId: string, placeId: string) => void
  updatePlace: (tripId: string, placeId: string, patch: Partial<Pick<Place, 'note' | 'durationMin'>>) => void
  movePlace: (tripId: string, placeId: string, to: ContainerId, index: number) => void
}

export const useTrips = create<TripsState>()(
  persist(
    (set) => {
      /** Применить чистую функцию к одной поездке. */
      const update = (tripId: string, fn: (trip: Trip) => Trip) =>
        set((s) => {
          const trip = s.trips[tripId]
          if (!trip) return s
          const next = fn(trip)
          return next === trip ? s : { trips: { ...s.trips, [tripId]: next } }
        })

      return {
        trips: {},
        hydrated: false,
        create: (city, start, days) => {
          const trip = T.createTrip(city, start, days)
          set((s) => ({ trips: { ...s.trips, [trip.id]: trip } }))
          return trip.id
        },
        save: (trip) => {
          set((s) => ({ trips: { ...s.trips, [trip.id]: trip } }))
          return trip.id
        },
        remove: (tripId) =>
          set((s) => {
            const trips = { ...s.trips }
            delete trips[tripId]
            return { trips }
          }),
        rename: (id, title) => update(id, (t) => T.renameTrip(t, title)),
        setStart: (id, date) => update(id, (t) => T.setStartDate(t, date)),
        addDay: (id) => update(id, T.addDay),
        removeDay: (id, dayId) => update(id, (t) => T.removeDay(t, dayId)),
        addPlace: (id, draft, to) => update(id, (t) => T.addPlace(t, draft, to)),
        removePlace: (id, placeId) => update(id, (t) => T.removePlace(t, placeId)),
        updatePlace: (id, placeId, patch) => update(id, (t) => T.updatePlace(t, placeId, patch)),
        movePlace: (id, placeId, to, index) => update(id, (t) => T.movePlace(t, placeId, to, index)),
      }
    },
    {
      name: 'tropa:trips',
      version: 1,
      storage: createJSONStorage(() => localStorage),
      // В localStorage — только поездки, служебный флаг не сохраняем.
      partialize: (s) => ({ trips: s.trips }),
      skipHydration: true,
      onRehydrateStorage: () => () => useTrips.setState({ hydrated: true }),
    },
  ),
)

/** Поездки по убыванию даты изменения. */
export const selectTripList = (s: TripsState) => Object.values(s.trips).sort((a, b) => b.updatedAt - a.updatedAt)
