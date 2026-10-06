'use client'

import { useEffect, useState } from 'react'

/** Значение, которое обновляется только после паузы в `delay` мс (пока пользователь печатает — не дёргаем API). */
export function useDebounced<T>(value: T, delay = 300): T {
  const [debounced, setDebounced] = useState(value)
  useEffect(() => {
    const id = setTimeout(() => setDebounced(value), delay)
    return () => clearTimeout(id)
  }, [value, delay])
  return debounced
}
