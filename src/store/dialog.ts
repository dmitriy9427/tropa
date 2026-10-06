import { create } from 'zustand'

// Диалоги вместо системных confirm() и prompt(): те выглядят чужеродно,
// блокируют страницу и не настраиваются. Вызов остаётся таким же простым:
//
//   if (await ask({ title: 'Удалить поездку?', confirmLabel: 'Удалить', tone: 'danger' })) …
//
// ask() кладёт параметры в хранилище и возвращает промис; <DialogHost>
// показывает диалог и разрешает промис ответом пользователя.

export type DialogOptions = {
  title: string
  text?: string
  confirmLabel: string
  cancelLabel?: string
  /** danger — красная кнопка подтверждения (необратимые действия). */
  tone?: 'default' | 'danger'
  /** Значение для копирования: показывается в поле, кнопка подтверждения копирует его. */
  copyValue?: string
}

type DialogState = {
  current: (DialogOptions & { resolve: (ok: boolean) => void }) | null
}

export const useDialog = create<DialogState>(() => ({ current: null }))

export function ask(options: DialogOptions): Promise<boolean> {
  // Если диалог уже открыт, прежний считается отменённым.
  useDialog.getState().current?.resolve(false)
  return new Promise((resolve) => useDialog.setState({ current: { ...options, resolve } }))
}

export function answer(ok: boolean): void {
  const current = useDialog.getState().current
  if (!current) return
  useDialog.setState({ current: null })
  current.resolve(ok)
}
