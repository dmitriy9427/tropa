'use client'

import { useSyncExternalStore } from 'react'
import { currentTheme, subscribeTheme, type Theme } from './theme'

/**
 * Тема как внешнее хранилище: React сам подписывается и перерисовывает.
 * На сервере темы нет — третий аргумент (getServerSnapshot) возвращает null,
 * и компонент до гидратации рисует нейтральное состояние.
 */
export function useTheme(): Theme | null {
  return useSyncExternalStore(subscribeTheme, currentTheme, () => null)
}
