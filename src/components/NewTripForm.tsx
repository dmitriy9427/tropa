'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { addDays, plural, today } from '@/lib/dates'
import { demoTrip } from '@/lib/demo'
import { MAX_DAYS } from '@/lib/trip'
import type { City } from '@/lib/types'
import { useTrips } from '@/store/trips'
import { useHydrateTrips } from '@/store/useHydrateTrips'
import { CityCombobox } from './CityCombobox'
import styles from './NewTripForm.module.scss'

export function NewTripForm() {
  const hydrated = useHydrateTrips()
  return (
    <div className={styles.card}>
      {/* Форма появляется только в браузере: ей нужна сегодняшняя дата и сохранённые
          поездки. На сервере (при сборке) на её месте — заглушка такого же размера. */}
      {hydrated ? <Form /> : <div className={styles.skeleton} aria-hidden="true" />}
    </div>
  )
}

function Form() {
  const router = useRouter()
  const create = useTrips((s) => s.create)
  const save = useTrips((s) => s.save)
  const [city, setCity] = useState<City | null>(null)
  const [start, setStart] = useState(() => addDays(today(), 14))
  const [days, setDays] = useState(3)

  const open = (id: string) => router.push(`/trip/?id=${id}`)

  return (
    <form
      className={styles.form}
      onSubmit={(e) => {
        e.preventDefault()
        if (city) open(create(city, start, days))
      }}
    >
      <CityCombobox value={city} onChange={setCity} />
      <div className={styles.row}>
        <label className={styles.field}>
          <span>Начало</span>
          <input type="date" value={start} min={today()} required onChange={(e) => setStart(e.target.value)} />
        </label>
        <div className={styles.field}>
          <span id="days-label">Дней</span>
          <div className={styles.stepper} role="group" aria-labelledby="days-label">
            <button type="button" aria-label="Меньше дней" disabled={days <= 1} onClick={() => setDays(days - 1)}>
              −
            </button>
            <output aria-live="polite">
              {days} {plural(days, 'день', 'дня', 'дней')}
            </output>
            <button type="button" aria-label="Больше дней" disabled={days >= MAX_DAYS} onClick={() => setDays(days + 1)}>
              +
            </button>
          </div>
        </div>
      </div>
      <div className={styles.actions}>
        <button type="submit" className="btn btn--accent" disabled={!city}>
          Собрать поездку
          <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
            <path d="M5 12h14m-6-6 6 6-6 6" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
        <button type="button" className="btn btn--ghost" onClick={() => open(save(demoTrip()))}>
          Посмотреть пример
        </button>
      </div>
    </form>
  )
}
