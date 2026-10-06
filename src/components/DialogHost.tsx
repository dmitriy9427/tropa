'use client'

import { useEffect, useRef, useState } from 'react'
import { answer, useDialog } from '@/store/dialog'
import styles from './DialogHost.module.scss'

/**
 * Один диалог на всё приложение. Нативный <dialog> с showModal() даёт
 * бесплатно: фокус внутри окна, закрытие по Esc, затемнение фона
 * (::backdrop) и «инертность» остальной страницы для скринридеров.
 */
export function DialogHost() {
  const current = useDialog((s) => s.current)
  const ref = useRef<HTMLDialogElement>(null)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    const dialog = ref.current
    if (!dialog) return
    if (current && !dialog.open) dialog.showModal()
    if (!current && dialog.open) dialog.close()
  }, [current])

  const copy = async () => {
    if (!current?.copyValue) return
    try {
      await navigator.clipboard.writeText(current.copyValue)
      setCopied(true)
      setTimeout(() => {
        setCopied(false)
        answer(true)
      }, 700)
    } catch {
      // Буфер обмена недоступен — выделяем текст, пользователь скопирует сам.
      ref.current?.querySelector('input')?.select()
    }
  }

  return (
    <dialog
      ref={ref}
      className={styles.dialog}
      aria-labelledby="dialog-title"
      aria-describedby={current?.text ? 'dialog-text' : undefined}
      // Esc: браузер закрывает диалог сам — сообщаем, что это отмена.
      onCancel={(e) => {
        e.preventDefault()
        answer(false)
      }}
      // Клик по затемнению вокруг окна — тоже отмена.
      onClick={(e) => e.target === e.currentTarget && answer(false)}
    >
      {current && (
        <form
          method="dialog"
          className={styles.body}
          onSubmit={(e) => {
            e.preventDefault()
            if (current.copyValue) void copy()
            else answer(true)
          }}
        >
          <h2 id="dialog-title" className="display">
            {current.title}
          </h2>
          {current.text && <p id="dialog-text">{current.text}</p>}
          {current.copyValue && (
            <input
              className={styles.field}
              readOnly
              value={current.copyValue}
              aria-label="Ссылка"
              onFocus={(e) => e.currentTarget.select()}
            />
          )}
          <div className={styles.actions}>
            <button type="button" className="btn btn--ghost" onClick={() => answer(false)}>
              {current.cancelLabel ?? 'Отмена'}
            </button>
            <button
              type="submit"
              className={`btn ${current.tone === 'danger' ? styles.danger : 'btn--accent'}`}
              // Для необратимых действий фокус — на «Отмена», чтобы случайный Enter ничего не удалил.
              autoFocus={current.tone !== 'danger'}
            >
              {copied ? 'Скопировано ✓' : current.confirmLabel}
            </button>
          </div>
        </form>
      )}
    </dialog>
  )
}
