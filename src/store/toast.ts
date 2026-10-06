import { create } from 'zustand'

// Короткие уведомления внизу экрана («Ссылка скопирована»).
// Хранилище маленькое и отдельное: его вызывают из любых обработчиков.

type Toast = { id: number; text: string }

export const useToasts = create<{ toasts: Toast[] }>(() => ({ toasts: [] }))

let counter = 0

export function toast(text: string, ms = 2600): void {
  const id = ++counter
  useToasts.setState((s) => ({ toasts: [...s.toasts, { id, text }] }))
  setTimeout(() => useToasts.setState((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })), ms)
}
