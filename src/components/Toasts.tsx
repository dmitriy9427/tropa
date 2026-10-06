'use client'

import { useToasts } from '@/store/toast'
import styles from './Toasts.module.scss'

export function Toasts() {
  const toasts = useToasts((s) => s.toasts)
  return (
    // role="status": скринридер прочитает новое уведомление, не перебивая пользователя.
    <div className={styles.stack} role="status" aria-live="polite">
      {toasts.map((t) => (
        <p key={t.id} className={styles.toast}>
          {t.text}
        </p>
      ))}
    </div>
  )
}
