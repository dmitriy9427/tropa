'use client'

import Link from 'next/link'
import { useShallow } from 'zustand/shallow'
import { formatRange, plural } from '@/lib/dates'
import { tripRange } from '@/lib/trip'
import { ask } from '@/store/dialog'
import { selectTripList, useTrips } from '@/store/trips'
import { useHydrateTrips } from '@/store/useHydrateTrips'
import styles from './SavedTrips.module.scss'

export function SavedTrips() {
  const hydrated = useHydrateTrips()
  // useShallow: селектор каждый раз собирает новый массив; без сравнения
  // по элементам компонент перерисовывался бы на любое изменение хранилища.
  const trips = useTrips(useShallow(selectTripList))
  const remove = useTrips((s) => s.remove)

  if (!hydrated) return <div className={styles.placeholder} aria-hidden="true" />
  if (!trips.length) {
    return <p className={styles.empty}>Пока пусто. Созданные поездки сохраняются в этом браузере и появятся здесь.</p>
  }

  return (
    <ul className={styles.grid}>
      {trips.map((trip, n) => {
        const { start, end } = tripRange(trip)
        const placed = trip.days.reduce((sum, d) => sum + d.placeIds.length, 0)
        return (
          <li key={trip.id} className={styles.card} style={{ '--n': n } as React.CSSProperties}>
            <Link href={`/trip/?id=${trip.id}`} className={styles.link}>
              <span className={styles.city}>{trip.city.name}</span>
              <span className={`${styles.title} display`}>{trip.title}</span>
              <span className={styles.meta}>
                {formatRange(start, end)} · {trip.days.length} {plural(trip.days.length, 'день', 'дня', 'дней')} · {placed}{' '}
                {plural(placed, 'место', 'места', 'мест')}
              </span>
              <span className={styles.dots} aria-hidden="true">
                {trip.days.map((d, i) => (
                  <i key={d.id} style={{ background: `var(--day-${i % 8})`, flexGrow: Math.max(d.placeIds.length, 0.4) }} />
                ))}
              </span>
            </Link>
            <button
              type="button"
              className={styles.remove}
              aria-label={`Удалить поездку «${trip.title}»`}
              onClick={async () => {
                const ok = await ask({
                  title: `Удалить «${trip.title}»?`,
                  text: 'Поездка удалится из этого браузера. Если вы делились ссылкой, у получателей копия останется.',
                  confirmLabel: 'Удалить',
                  tone: 'danger',
                })
                if (ok) remove(trip.id)
              }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" aria-hidden="true">
                <path d="M6 6l12 12M18 6 6 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              </svg>
            </button>
          </li>
        )
      })}
    </ul>
  )
}
