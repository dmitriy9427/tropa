'use client'

import Link from 'next/link'
import { useState } from 'react'
import { formatRange, plural } from '@/lib/dates'
import { formatKm, routeKm } from '@/lib/geo'
import { downloadICS } from '@/lib/ics'
import { shareUrl } from '@/lib/share'
import { dayPlaces, MAX_DAYS, tripRange } from '@/lib/trip'
import type { Trip } from '@/lib/types'
import { ask } from '@/store/dialog'
import { toast } from '@/store/toast'
import { useTrips } from '@/store/trips'
import { Icon } from '../Icon'
import styles from './TripHeader.module.scss'

export function TripHeader({ trip }: { trip: Trip }) {
  const rename = useTrips((s) => s.rename)
  const setStart = useTrips((s) => s.setStart)
  const addDay = useTrips((s) => s.addDay)
  const [title, setTitle] = useState(trip.title)
  const { start, end } = tripRange(trip)
  const placed = trip.days.reduce((n, d) => n + d.placeIds.length, 0)
  const km = trip.days.reduce((sum, d) => sum + routeKm(dayPlaces(trip, d)), 0)

  const share = async () => {
    const url = shareUrl(trip)
    // На телефоне — системное меню «Поделиться», на компьютере — копируем ссылку.
    if (navigator.share && matchMedia('(pointer: coarse)').matches) {
      try {
        await navigator.share({ title: trip.title, url })
        return
      } catch {
        // Пользователь закрыл меню — ничего не делаем.
        return
      }
    }
    try {
      await navigator.clipboard.writeText(url)
      toast('Ссылка скопирована — отправь её попутчикам')
    } catch {
      // Буфер обмена недоступен (например, страница открыта не по https) — показываем ссылку в диалоге.
      void ask({
        title: 'Ссылка на поездку',
        text: 'В ней вся поездка: откройте её на другом устройстве или отправьте попутчикам.',
        confirmLabel: 'Скопировать',
        cancelLabel: 'Закрыть',
        copyValue: url,
      })
    }
  }

  return (
    <header className={styles.head}>
      <div className={styles.top}>
        <Link href="/#trips" className="btn btn--ghost btn--icon" aria-label="Все поездки">
          <Icon name="back" />
        </Link>
        <span className={styles.city}>
          {trip.city.name}
          {trip.city.country && <span>, {trip.city.country}</span>}
        </span>
      </div>

      <input
        className={`${styles.title} display`}
        value={title}
        aria-label="Название поездки"
        maxLength={60}
        onChange={(e) => setTitle(e.target.value)}
        onBlur={() => {
          rename(trip.id, title)
          if (!title.trim()) setTitle(trip.title)
        }}
        onKeyDown={(e) => e.key === 'Enter' && e.currentTarget.blur()}
      />

      <div className={styles.meta}>
        <label className={styles.dates}>
          <Icon name="calendar" size={16} />
          <span>{formatRange(start, end)}</span>
          <input
            type="date"
            value={start}
            aria-label="Дата начала поездки"
            onChange={(e) => e.target.value && setStart(trip.id, e.target.value)}
          />
        </label>
        <span>
          {trip.days.length} {plural(trip.days.length, 'день', 'дня', 'дней')}
        </span>
        <span>
          {placed} {plural(placed, 'место', 'места', 'мест')}
        </span>
        {km > 0 && <span>{formatKm(km)} пешком</span>}
      </div>

      <div className={styles.actions}>
        <button type="button" className="btn btn--sm" onClick={share}>
          <Icon name="share" size={16} />
          Поделиться
        </button>
        <button type="button" className="btn btn--sm" onClick={() => downloadICS(trip)}>
          <Icon name="calendar" size={16} />В календарь
        </button>
        <button
          type="button"
          className="btn btn--sm btn--ghost"
          disabled={trip.days.length >= MAX_DAYS}
          onClick={() => addDay(trip.id)}
        >
          <Icon name="plus" size={16} />
          День
        </button>
      </div>
    </header>
  )
}
