'use client'

import { FORECAST_DAYS } from '@/lib/api'
import { daysBetween, formatDay, formatWeekday, today } from '@/lib/dates'
import { formatKm, formatMinutes, routeKm, walkMinutes } from '@/lib/geo'
import { useForecast } from '@/lib/queries'
import { dayPlaces } from '@/lib/trip'
import type { Day, Trip } from '@/lib/types'
import { describeWeather, isBadWeather } from '@/lib/weather'
import { useTrips } from '@/store/trips'
import { Icon, WeatherIcon } from '../Icon'
import styles from './Board.module.scss'

type Props = { trip: Trip; day: Day; index: number; active: boolean; onToggle: () => void }

export function DayHeader({ trip, day, index, active, onToggle }: Props) {
  const removeDay = useTrips((s) => s.removeDay)
  const places = dayPlaces(trip, day)
  const km = routeKm(places)
  const walk = walkMinutes(km)
  const visit = places.reduce((sum, p) => sum + p.durationMin, 0)

  return (
    <div className={styles.dayHead}>
      <button
        type="button"
        className={styles.dayToggle}
        aria-pressed={active}
        title={active ? 'Показать все дни на карте' : 'Показать этот день на карте'}
        onClick={onToggle}
      >
        <span className={styles.dayNum}>День {index + 1}</span>
        <span className={`${styles.dayDate} display`}>
          {formatDay(day.date)} <small>{formatWeekday(day.date)}</small>
        </span>
      </button>
      <Weather trip={trip} date={day.date} />
      {trip.days.length > 1 && (
        <button
          type="button"
          className={styles.dayRemove}
          aria-label={`Удалить день ${index + 1}`}
          title="Удалить день (места вернутся в «Идеи»)"
          onClick={() => removeDay(trip.id, day.id)}
        >
          <Icon name="trash" size={16} />
        </button>
      )}
      {places.length > 0 && (
        <p className={styles.dayStats}>
          <span>
            <Icon name="walk" size={14} />
            {formatKm(km)} · {formatMinutes(walk)}
          </span>
          <span>
            <Icon name="clock" size={14} />
            весь день ≈ {formatMinutes(walk + visit)}
          </span>
        </p>
      )}
    </div>
  )
}

function Weather({ trip, date }: { trip: Trip; date: string }) {
  const ahead = daysBetween(today(), date)
  const inRange = ahead >= 0 && ahead < FORECAST_DAYS
  const { data, isLoading } = useForecast(trip.city)
  if (!inRange) {
    return (
      <span className={styles.weatherNone} title="Прогноз доступен за 16 дней до даты">
        {ahead < 0 ? 'прошло' : 'прогноз позже'}
      </span>
    )
  }
  if (isLoading) return <span className={styles.weatherSkeleton} aria-hidden="true" />
  const w = data?.[date]
  if (!w) return null
  const { label, icon } = describeWeather(w.code)
  const bad = isBadWeather(w.code, w.rain)
  return (
    <span className={styles.weather} data-bad={bad || undefined} title={`${label}, вероятность осадков ${w.rain}%`}>
      <WeatherIcon kind={icon} />
      <b>{w.max > 0 ? `+${w.max}` : w.max}°</b>
      <span>{w.min > 0 ? `+${w.min}` : w.min}°</span>
      <span className="visually-hidden">
        {label}, осадки {w.rain}%
      </span>
    </span>
  )
}
