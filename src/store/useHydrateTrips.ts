'use client'

import { useEffect } from 'react'
import { useTrips } from './trips'

/**
 * Подгрузить поездки из localStorage после монтирования и вернуть флаг
 * «данные готовы». До этого компонент рисует заглушку — она же была в HTML,
 * собранном на сервере, поэтому гидратация проходит без расхождений.
 */
export function useHydrateTrips(): boolean {
  const hydrated = useTrips((s) => s.hydrated)
  useEffect(() => {
    if (!useTrips.getState().hydrated) void useTrips.persist.rehydrate()
  }, [])
  return hydrated
}
