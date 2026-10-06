'use client'

import { setTheme } from '@/lib/theme'
import { useTheme } from '@/lib/useTheme'
import styles from './ThemeToggle.module.scss'

// Переключатель: ползунок-«солнце», которое при переходе в ночь
// «съедается» тенью и превращается в месяц, вокруг гаснут лучи.
export function ThemeToggle() {
  const theme = useTheme()
  const dark = theme === 'dark'
  return (
    <button
      type="button"
      role="switch"
      aria-checked={dark}
      aria-label="Тёмная тема"
      className={styles.toggle}
      data-dark={dark || undefined}
      // До гидратации тема неизвестна — кнопка видна, но без анимации.
      data-ready={theme !== null || undefined}
      onClick={() => setTheme(dark ? 'light' : 'dark')}
    >
      <span className={styles.stars} aria-hidden="true" />
      <span className={styles.knob} aria-hidden="true">
        <svg viewBox="0 0 24 24">
          <g className={styles.rays}>
            {Array.from({ length: 8 }, (_, i) => (
              <line key={i} x1="12" y1="1.5" x2="12" y2="4" transform={`rotate(${i * 45} 12 12)`} />
            ))}
          </g>
          <mask id="moon-mask">
            <rect width="24" height="24" fill="#fff" />
            <circle className={styles.bite} cx="24" cy="4" r="6" fill="#000" />
          </mask>
          <circle className={styles.core} cx="12" cy="12" r="5.5" mask="url(#moon-mask)" />
        </svg>
      </span>
    </button>
  )
}
